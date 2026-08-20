import asyncHandler from "../../utils/asyncHandler.js";
import { sendResponse } from "../../utils/ApiResponse.js";
import * as mediaService from "./media.service.js";

const uploadFile = asyncHandler(async (req, res) => {
  const media = await mediaService.uploadFile(req.user._id, req.file, req.body);
  return sendResponse(res, 201, "File uploaded successfully.", media);
});

const listFiles = asyncHandler(async (req, res) => {
  const { files, folders, meta } = await mediaService.listFiles(req.query);
  return sendResponse(res, 200, "Media files fetched successfully.", files, { ...meta, folders });
});

const getFile = asyncHandler(async (req, res) => {
  const file = await mediaService.getFile(req.params.id);
  return sendResponse(res, 200, "Media file fetched successfully.", file);
});

const deleteFile = asyncHandler(async (req, res) => {
  await mediaService.deleteFile(req.params.id);
  return sendResponse(res, 200, "Media file deleted successfully.");
});

export { uploadFile, listFiles, getFile, deleteFile };
