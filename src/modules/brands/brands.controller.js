import asyncHandler from "../../utils/asyncHandler.js";
import { sendResponse } from "../../utils/ApiResponse.js";
import * as brandService from "./brands.service.js";

const listBrands = asyncHandler(async (req, res) => {
  const { brands, meta } = await brandService.listBrands(req.query);
  return sendResponse(res, 200, "Brands fetched successfully.", brands, meta);
});

const listAllBrands = asyncHandler(async (_req, res) => {
  const brands = await brandService.listAllBrands();
  return sendResponse(res, 200, "Brands fetched successfully.", brands);
});

const getBrandById = asyncHandler(async (req, res) => {
  const brand = await brandService.getBrandById(req.params.id);
  return sendResponse(res, 200, "Brand fetched successfully.", brand);
});

const createBrand = asyncHandler(async (req, res) => {
  const brand = await brandService.createBrand(req.body);
  return sendResponse(res, 201, "Brand created successfully.", brand);
});

const updateBrand = asyncHandler(async (req, res) => {
  const brand = await brandService.updateBrand(req.params.id, req.body);
  return sendResponse(res, 200, "Brand updated successfully.", brand);
});

const deleteBrand = asyncHandler(async (req, res) => {
  await brandService.deleteBrand(req.params.id);
  return sendResponse(res, 200, "Brand deleted successfully.");
});

export { listBrands, listAllBrands, getBrandById, createBrand, updateBrand, deleteBrand };
