import asyncHandler from "../../utils/asyncHandler.js";
import { sendResponse } from "../../utils/ApiResponse.js";
import * as productService from "./products.service.js";

const listProducts = asyncHandler(async (req, res) => {
  const { products, meta } = await productService.listProducts(req.query);
  return sendResponse(res, 200, "Products fetched successfully.", products, meta);
});

const listAdminProducts = asyncHandler(async (req, res) => {
  const { products, meta } = await productService.listProducts(req.query, { admin: true });
  return sendResponse(res, 200, "Products fetched successfully.", products, meta);
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  const related = await productService.getRelatedProducts(product);
  return sendResponse(res, 200, "Product fetched successfully.", { ...product.toJSON(), related });
});

const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await productService.getProductBySlug(req.params.slug);
  const related = await productService.getRelatedProducts(product);
  return sendResponse(res, 200, "Product fetched successfully.", { ...product.toJSON(), related });
});

const getAdminProduct = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id, { admin: true });
  return sendResponse(res, 200, "Product fetched successfully.", product);
});

const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body, req.files);
  return sendResponse(res, 201, "Product created successfully.", product);
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body, req.files);
  return sendResponse(res, 200, "Product updated successfully.", product);
});

const deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.params.id);
  return sendResponse(res, 200, "Product deleted successfully.");
});

const removeImage = asyncHandler(async (req, res) => {
  const product = await productService.removeImage(req.params.id, req.body.publicId);
  return sendResponse(res, 200, "Image removed successfully.", product);
});

export {
  listProducts,
  listAdminProducts,
  getProduct,
  getProductBySlug,
  getAdminProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  removeImage,
};
