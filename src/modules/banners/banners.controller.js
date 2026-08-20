import asyncHandler from "../../utils/asyncHandler.js";
import { sendResponse } from "../../utils/ApiResponse.js";
import * as bannerService from "./banners.service.js";

const listActiveBanners = asyncHandler(async (req, res) => {
  const banners = await bannerService.listActiveBanners(req.query);
  return sendResponse(res, 200, "Banners fetched successfully.", banners);
});

const listAllBanners = asyncHandler(async (req, res) => {
  const { banners, meta } = await bannerService.listAllBanners(req.query);
  return sendResponse(res, 200, "Banners fetched successfully.", banners, meta);
});

const getBannerById = asyncHandler(async (req, res) => {
  const banner = await bannerService.getBannerById(req.params.id);
  return sendResponse(res, 200, "Banner fetched successfully.", banner);
});

const createBanner = asyncHandler(async (req, res) => {
  const banner = await bannerService.createBanner(req.body);
  return sendResponse(res, 201, "Banner created successfully.", banner);
});

const updateBanner = asyncHandler(async (req, res) => {
  const banner = await bannerService.updateBanner(req.params.id, req.body);
  return sendResponse(res, 200, "Banner updated successfully.", banner);
});

const deleteBanner = asyncHandler(async (req, res) => {
  await bannerService.deleteBanner(req.params.id);
  return sendResponse(res, 200, "Banner deleted successfully.");
});

const trackBannerClick = asyncHandler(async (req, res) => {
  const banner = await bannerService.trackBanner(req.params.id, "clicks");
  return sendResponse(res, 200, "Banner click tracked.", banner);
});

export { listActiveBanners, listAllBanners, getBannerById, createBanner, updateBanner, deleteBanner, trackBannerClick };
