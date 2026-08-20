import asyncHandler from "../../utils/asyncHandler.js";
import { sendResponse } from "../../utils/ApiResponse.js";
import * as wishlistService from "./wishlist.service.js";

const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.getWishlist(req.user._id);
  return sendResponse(res, 200, "Wishlist fetched successfully.", wishlist);
});

const addProduct = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.addProduct(req.user._id, req.params.productId);
  return sendResponse(res, 201, "Product added to wishlist.", wishlist);
});

const removeProduct = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.removeProduct(req.user._id, req.params.productId);
  return sendResponse(res, 200, "Product removed from wishlist.", wishlist);
});

const clearWishlist = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.clearWishlist(req.user._id);
  return sendResponse(res, 200, "Wishlist cleared.", wishlist);
});

const toggleProduct = asyncHandler(async (req, res) => {
  const result = await wishlistService.toggleProduct(req.user._id, req.params.productId);
  return sendResponse(res, 200, "Wishlist updated.", result);
});

export { getWishlist, addProduct, removeProduct, clearWishlist, toggleProduct };
