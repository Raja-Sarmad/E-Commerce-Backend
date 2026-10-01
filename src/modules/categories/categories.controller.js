import asyncHandler from "../../utils/asyncHandler.js";
import { sendResponse } from "../../utils/ApiResponse.js";
import * as categoryService from "./categories.service.js";

const storeId = (req) => req.store._id;

const listCategories = asyncHandler(async (req, res) => {
  const { categories, meta } = await categoryService.listCategories(req.query, { storeId: storeId(req) });
  return sendResponse(res, 200, "Categories fetched successfully.", categories, meta);
});

const listAllCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.listAllCategories({ storeId: storeId(req) });
  return sendResponse(res, 200, "Categories fetched successfully.", categories);
});

const listAdminCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.listAllCategories({ admin: true, storeId: storeId(req) });
  return sendResponse(res, 200, "Categories fetched successfully.", categories);
});

const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryBySlug(req.params.slug, storeId(req));
  return sendResponse(res, 200, "Category fetched successfully.", category);
});

const getCategoryById = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.id, storeId(req));
  return sendResponse(res, 200, "Category fetched successfully.", category);
});

const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body, storeId(req));
  return sendResponse(res, 201, "Category created successfully.", category);
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body, storeId(req));
  return sendResponse(res, 200, "Category updated successfully.", category);
});

const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.id, storeId(req));
  return sendResponse(res, 200, "Category deleted successfully.");
});

export {
  listCategories,
  listAllCategories,
  listAdminCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
};
