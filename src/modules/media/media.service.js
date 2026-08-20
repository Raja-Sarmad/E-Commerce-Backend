import MediaFile from "./media.model.js";
import AppError from "../../utils/AppError.js";
import { getPagination, getPaginationMeta, getSort } from "../../utils/pagination.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../../utils/cloudinary.js";

const FOLDERS = ["Products", "Banners", "Blog", "Brands", "Categories", "Newsletter", "Other"];

async function uploadFile(userId, file, { folder = "Other", name } = {}) {
  if (!file) throw new AppError("No file uploaded.", 400);

  const safeFolder = FOLDERS.includes(folder) ? folder : "Other";
  const { url, publicId } = await uploadToCloudinary({
    buffer: file.buffer,
    mimetype: file.mimetype,
    folder: `novamart/${safeFolder.toLowerCase()}`,
  });

  const type = file.mimetype.startsWith("video/") ? "video"
    : file.mimetype === "application/pdf" ? "document"
      : "image";

  const media = await MediaFile.create({
    name: name || file.originalname,
    url,
    publicId,
    type,
    size: file.size,
    folder: safeFolder,
    uploadedBy: userId,
  });

  return media;
}

async function listFiles(query) {
  const { page, limit, skip } = getPagination(query);
  const sort = getSort(query, ["createdAt", "name"]);

  const filter = {};
  if (query.folder) filter.folder = query.folder;
  if (query.type) filter.type = query.type;
  if (query.search) filter.name = new RegExp(query.search.trim(), "i");

  const [files, total, folders] = await Promise.all([
    MediaFile.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    MediaFile.countDocuments(filter),
    MediaFile.aggregate([
      { $group: { _id: "$folder", files: { $sum: 1 }, size: { $sum: "$size" } } },
    ]),
  ]);

  return {
    files,
    folders,
    meta: getPaginationMeta({ page, limit, total, totalPages: Math.ceil(total / limit) }),
  };
}

async function getFile(id) {
  const file = await MediaFile.findById(id);
  if (!file) throw new AppError("Media file not found.", 404);
  return file;
}

async function deleteFile(id) {
  const file = await MediaFile.findById(id);
  if (!file) throw new AppError("Media file not found.", 404);
  if (file.publicId) await deleteFromCloudinary(file.publicId);
  await file.deleteOne();
  return file;
}

export { uploadFile, listFiles, getFile, deleteFile, FOLDERS };
