import asyncHandler from "../../utils/asyncHandler.js";
import { sendResponse } from "../../utils/ApiResponse.js";
import * as categoryService from "./categories.service.js";

const listCategories = asyncHandler(async (req, res) => {
  const { categories, meta } = await categoryService.listCategories(req.query);
  return sendResponse(res, 200, "Categories fetched successfully.", categories, meta);
});

const listAllCategories = asyncHandler(async (_req, res) => {
  const categories = await categoryService.listAllCategories();
  return sendResponse(res, 200, "Categories fetched successfully.", categories);
});

const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryBySlug(req.params.slug);
  return sendResponse(res, 200, "Category fetched successfully.", category);
});

const getCategoryById = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.id);
  return sendResponse(res, 200, "Category fetched successfully.", category);
});

const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  return sendResponse(res, 201, "Category created successfully.", category);
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  return sendResponse(res, 200, "Category updated successfully.", category);
});

const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.id);
  return sendResponse(res, 200, "Category deleted successfully.");
});

export {
  listCategories,
  listAllCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
};
