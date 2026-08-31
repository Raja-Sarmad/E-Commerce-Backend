import cloudinaryModule from "cloudinary";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import config from "../config/index.js";
import AppError from "./AppError.js";

const cloudinary = cloudinaryModule.v2;

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
  secure: true,
});

const EXTENSIONS = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
  "image/bmp": ".bmp",
  "image/tiff": ".tiff",
  "image/avif": ".avif",
  "image/heic": ".heic",
  "image/heif": ".heif",
  "image/x-icon": ".ico",
  "image/vnd.microsoft.icon": ".ico",
  "application/pdf": ".pdf",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

function getLocalFolder(folder) {
  return folder
    .split("/")
    .map((part) => part.replace(/[^a-z0-9_-]/gi, "").toLowerCase())
    .filter(Boolean)
    .join("/");
}

async function uploadToLocal(file, folder = config.cloudinary.folder) {
  const localFolder = getLocalFolder(folder);
  const extension = EXTENSIONS[file.mimetype] || path.extname(file.originalname || "") || ".bin";
  const filename = `${Date.now()}-${randomUUID()}${extension.toLowerCase()}`;
  const relativePath = path.posix.join(localFolder, filename);
  const destination = path.join(config.uploadsDir, ...localFolder.split("/"), filename);

  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, file.buffer);

  return {
    url: `${config.serverUrl}/uploads/${relativePath}`,
    publicId: `local:${relativePath}`,
  };
}

/**
 * Upload a single file buffer to Cloudinary using unsigned upload preset via REST API.
 * No API key/secret required — only cloud_name + upload_preset.
 */
async function uploadToCloudinary(opts) {
  const { buffer, mimetype = "image/*" } = opts;
  const uploadPreset = config.cloudinary.uploadPreset;
  const cloudName = config.cloudinary.cloudName;

  if (!cloudName || !uploadPreset) {
    throw new AppError("Cloudinary cloud name or upload preset is missing in .env", 500);
  }

  const isVideo = mimetype.startsWith("video/");
  const resourceType = isVideo ? "video" : "image";

  const form = new FormData();
  const blob = new Blob([buffer], { type: mimetype });
  form.append("file", blob, `upload${EXTENSIONS[mimetype] || ".bin"}`);
  form.append("upload_preset", uploadPreset);
  if (opts.folder) form.append("folder", opts.folder);

  const isVercel = Boolean(process.env.VERCEL);
  const timeoutMs = isVercel
    ? Math.min(config.cloudinary.uploadTimeoutMs, 25000)
    : config.cloudinary.uploadTimeoutMs;

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      {
        method: "POST",
        body: form,
        signal: controller.signal,
      }
    );

    const result = await response.json();

    if (!response.ok) {
      const message = result?.error?.message || response.statusText;
      console.error("[cloudinary] Upload failed:", response.status, message);
      throw new AppError(`Image upload failed: ${message}`, response.status);
    }

    return { url: result.secure_url, publicId: result.public_id };
  } catch (err) {
    if (err.name === "AbortError") {
      throw new AppError(
        isVercel
          ? "Image upload timed out on the server. Use a smaller image or try again."
          : "Cloudinary upload timed out. Check your internet connection.",
        500
      );
    }
    if (err instanceof AppError) throw err;
    throw new AppError(`Image upload failed: ${err.message}`, 500);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Upload an array of files (from multer req.files) to Cloudinary.
 * Uploads one-by-one to avoid overwhelming the API.
 */
async function uploadMany(files, folder = config.cloudinary.folder) {
  if (!files || files.length === 0) return [];

  const results = [];
  for (const file of files) {
    let result;
    try {
      result = await uploadToCloudinaryWithRetry(file, folder);
    } catch (err) {
      if (!config.cloudinary.fallbackToLocal) throw err;
      console.warn(`[cloudinary] Upload failed, saved locally instead: ${err.message}`);
      result = await uploadToLocal(file, folder);
    }
    results.push(result);
  }
  return results;
}

async function uploadToCloudinaryWithRetry(file, folder) {
  let lastError;
  const attempts = Math.max(1, config.cloudinary.uploadRetries + 1);

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await uploadToCloudinary({
        buffer: file.buffer,
        mimetype: file.mimetype,
        folder,
      });
    } catch (err) {
      lastError = err;
      if (attempt === attempts) break;
      console.warn(
        `[cloudinary] Upload attempt ${attempt}/${attempts} failed: ${err.message}. Retrying...`
      );
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }

  throw lastError;
}

/**
 * Delete an asset from Cloudinary by public_id.
 */
async function deleteFromCloudinary(publicId) {
  if (!publicId) return;
  if (publicId.startsWith("local:")) {
    const relativePath = publicId.slice("local:".length);
    const localPath = path.resolve(config.uploadsDir, relativePath);
    if (!localPath.startsWith(path.resolve(config.uploadsDir))) return;
    try {
      await unlink(localPath);
    } catch {
      // ignore
    }
    return;
  }
  if (!config.cloudinary.cloudName) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch {
    // ignore
  }
}

/**
 * Download image from URL and upload it to Cloudinary.
 */
async function uploadUrlToCloudinary(imageUrl, folder = config.cloudinary.folder) {
  const uploadPreset = config.cloudinary.uploadPreset;
  const cloudName = config.cloudinary.cloudName;

  if (!cloudName || !uploadPreset) {
    throw new AppError("Cloudinary cloud name or upload preset is missing in .env", 500);
  }

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new AppError(`Failed to download image from URL: ${imageUrl}`, 400);
  }

  const contentType = response.headers.get("content-type") || "image/*";
  const isVideo = contentType.startsWith("video/");
  const resourceType = isVideo ? "video" : "image";

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const form = new FormData();
  form.append("file", `data:${contentType};base64,${buffer.toString("base64")}`);
  form.append("upload_preset", uploadPreset);

  const cloudResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    { method: "POST", body: form }
  );

  const result = await cloudResponse.json();

  if (!cloudResponse.ok) {
    const message = result?.error?.message || cloudResponse.statusText;
    throw new AppError(`Image upload failed: ${message}`, cloudResponse.status);
  }

  return { url: result.secure_url, publicId: result.public_id };
}

async function uploadUrls(urls, folder = config.cloudinary.folder) {
  if (!urls || urls.length === 0) return [];

  const results = [];
  for (const url of urls) {
    let result;
    try {
      result = await uploadUrlToCloudinary(url, folder);
    } catch (err) {
      console.warn(`[cloudinary] Failed to upload URL image, keeping original: ${err.message}`);
      result = { url, publicId: null };
    }
    results.push(result);
  }
  return results;
}

function isCloudinaryUrl(url) {
  return typeof url === "string" && url.includes("res.cloudinary.com");
}

function publicIdFromCloudinaryUrl(url) {
  if (!isCloudinaryUrl(url)) return null;
  const marker = "/upload/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  let path = url.slice(idx + marker.length).replace(/^v\d+\//, "");
  const query = path.indexOf("?");
  if (query !== -1) path = path.slice(0, query);
  return path.replace(/\.[^/.]+$/, "");
}

async function resolveRemoteImages(urls = [], folder = config.cloudinary.folder) {
  const results = [];
  const external = [];

  for (const url of urls.filter(Boolean)) {
    if (isCloudinaryUrl(url)) {
      results.push({ url, publicId: publicIdFromCloudinaryUrl(url) });
    } else {
      external.push(url);
    }
  }

  if (external.length > 0) {
    results.push(...(await uploadUrls(external, folder)));
  }

  return results;
}

export {
  uploadToCloudinary,
  uploadMany,
  uploadUrls,
  uploadUrlToCloudinary,
  resolveRemoteImages,
  deleteFromCloudinary,
};
