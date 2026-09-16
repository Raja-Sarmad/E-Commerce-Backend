import asyncHandler from "../../utils/asyncHandler.js";
import { sendResponse } from "../../utils/ApiResponse.js";
import * as reelService from "./reels.service.js";

const listActiveReels = asyncHandler(async (req, res) => {
  const reels = await reelService.listActiveReels();
  return sendResponse(res, 200, "Reels fetched successfully.", reels);
});

const listAllReels = asyncHandler(async (req, res) => {
  const reels = await reelService.listAllReels();
  return sendResponse(res, 200, "Reels fetched successfully.", reels);
});

const getReelById = asyncHandler(async (req, res) => {
  const reel = await reelService.getReelById(req.params.id);
  return sendResponse(res, 200, "Reel fetched successfully.", reel);
});

const createReel = asyncHandler(async (req, res) => {
  const reel = await reelService.createReel(req.body);
  return sendResponse(res, 201, "Reel created successfully.", reel);
});

const updateReel = asyncHandler(async (req, res) => {
  const reel = await reelService.updateReel(req.params.id, req.body);
  return sendResponse(res, 200, "Reel updated successfully.", reel);
});

const deleteReel = asyncHandler(async (req, res) => {
  await reelService.deleteReel(req.params.id);
  return sendResponse(res, 200, "Reel deleted successfully.");
});

export {
  listActiveReels,
  listAllReels,
  getReelById,
  createReel,
  updateReel,
  deleteReel,
};
