import asyncHandler from "../../utils/asyncHandler.js";
import { sendResponse } from "../../utils/ApiResponse.js";
import * as reviewService from "./reviews.service.js";

const listProductReviews = asyncHandler(async (req, res) => {
  const { reviews, meta } = await reviewService.listProductReviews(req.params.productId, req.query);
  return sendResponse(res, 200, "Reviews fetched successfully.", reviews, meta);
});

const listAllReviews = asyncHandler(async (req, res) => {
  const { reviews, meta } = await reviewService.listAllReviews(req.query);
  return sendResponse(res, 200, "Reviews fetched successfully.", reviews, meta);
});

const createReview = asyncHandler(async (req, res) => {
  const review = await reviewService.createReview(req.user, req.body);
  return sendResponse(res, 201, "Review submitted successfully.", review);
});

const updateReview = asyncHandler(async (req, res) => {
  const review = await reviewService.updateReview(req.user, req.params.id, req.body);
  return sendResponse(res, 200, "Review updated successfully.", review);
});

const deleteReview = asyncHandler(async (req, res) => {
  await reviewService.deleteReview(req.user, req.params.id);
  return sendResponse(res, 200, "Review deleted successfully.");
});

const moderateReview = asyncHandler(async (req, res) => {
  const review = await reviewService.moderateReview(req.params.id, req.body.status);
  return sendResponse(res, 200, `Review ${req.body.status}.`, review);
});

const toggleHelpful = asyncHandler(async (req, res) => {
  const review = await reviewService.toggleHelpful(req.user, req.params.id);
  return sendResponse(res, 200, "Review helpfulness updated.", review);
});

export {
  listProductReviews,
  listAllReviews,
  createReview,
  updateReview,
  deleteReview,
  moderateReview,
  toggleHelpful,
};
