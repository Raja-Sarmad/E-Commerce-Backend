import multer from "multer";
import AppError from "../utils/AppError.js";
import config from "../config/index.js";

const MAX_SIZE = config.maxUploadMb * 1024 * 1024;

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/bmp",
  "image/tiff",
  "image/avif",
  "image/heic",
  "image/heif",
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "application/pdf",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return cb(new AppError("Unsupported file type.", 400));
  }
  return cb(null, true);
};

/**
 * Single image upload — field name e.g. "image", "avatar", "logo".
 */
const uploadSingle = (field) =>
  multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE } }).single(field);

/**
 * Multiple images — field name e.g. "images".
 */
const uploadMultiple = (field, maxCount = 8) =>
  multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_SIZE, files: maxCount },
  }).array(field, maxCount);

/**
 * Any single file (image/video/document) — for media library.
 */
const uploadMedia = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE * 4 },
}).single("file");

export { uploadSingle, uploadMultiple, uploadMedia };
