import Review from "./reviews.model.js";
import Product from "../products/products.model.js";
import AppError from "../../utils/AppError.js";
import { getPagination, getPaginationMeta, getSort } from "../../utils/pagination.js";

/**
 * Recompute a product's aggregate rating + review count.
 */
async function recomputeProductRating(productId) {
  const agg = await Review.aggregate([
    { $match: { product: productId, status: "approved" } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const result = agg[0] || { avg: 0, count: 0 };
  await Product.findByIdAndUpdate(productId, {
    rating: Math.round(result.avg * 10) / 10,
    reviewsCount: result.count,
  });
}

async function listProductReviews(productId, query) {
  const { page, limit, skip } = getPagination(query);
  const sort = getSort(query, ["createdAt", "rating", "helpful"]);

  const filter = { product: productId, status: "approved" };
  if (query.rating) filter.rating = Number(query.rating);

  const [reviews, total] = await Promise.all([
    Review.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Review.countDocuments(filter),
  ]);

  return {
    reviews,
    meta: getPaginationMeta({ page, limit, total, totalPages: Math.ceil(total / limit) }),
  };
}

async function listAllReviews(query) {
  const { page, limit, skip } = getPagination(query);
  const sort = getSort(query, ["createdAt", "rating"]);

  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.product) filter.product = query.product;
  if (query.rating) filter.rating = Number(query.rating);
  if (query.search) filter.$or = [{ name: new RegExp(query.search, "i") }, { body: new RegExp(query.search, "i") }];

  const [reviews, total] = await Promise.all([
    Review.find(filter).sort(sort).skip(skip).limit(limit)
      .populate("product", "name slug")
      .populate("user", "name email")
      .lean(),
    Review.countDocuments(filter),
  ]);

  return {
    reviews,
    meta: getPaginationMeta({ page, limit, total, totalPages: Math.ceil(total / limit) }),
  };
}

async function createReview(user, { productId, rating, title, body }) {
  const product = await Product.findById(productId);
  if (!product) throw new AppError("Product not found.", 404);

  const existing = await Review.findOne({ product: productId, user: user._id });
  if (existing) throw new AppError("You have already reviewed this product.", 409);

  const review = await Review.create({
    product: productId,
    user: user._id,
    name: user.name,
    rating,
    title,
    body,
    verified: true,
  });

  await recomputeProductRating(productId);
  return review;
}

async function updateReview(user, reviewId, data) {
  const review = await Review.findById(reviewId);
  if (!review) throw new AppError("Review not found.", 404);

  const isOwner = String(review.user) === String(user._id);
  const isAdmin = ["admin", "super_admin", "manager"].includes(user.role);
  if (!isOwner && !isAdmin) {
    throw new AppError("You do not have permission to edit this review.", 403);
  }

  if (data.rating !== undefined) review.rating = data.rating;
  if (data.title !== undefined) review.title = data.title;
  if (data.body !== undefined) review.body = data.body;
  await review.save();

  await recomputeProductRating(review.product);
  return review;
}

async function deleteReview(user, reviewId) {
  const review = await Review.findById(reviewId);
  if (!review) throw new AppError("Review not found.", 404);

  const isOwner = String(review.user) === String(user._id);
  const isAdmin = ["admin", "super_admin", "manager"].includes(user.role);
  if (!isOwner && !isAdmin) {
    throw new AppError("You do not have permission to delete this review.", 403);
  }

  const productId = review.product;
  await review.deleteOne();
  await recomputeProductRating(productId);
  return review;
}

async function moderateReview(reviewId, status) {
  const review = await Review.findById(reviewId);
  if (!review) throw new AppError("Review not found.", 404);
  review.status = status;
  await review.save();
  await recomputeProductRating(review.product);
  return review;
}

async function toggleHelpful(user, reviewId) {
  const review = await Review.findById(reviewId);
  if (!review) throw new AppError("Review not found.", 404);

  const already = review.helpfulBy.some(
    (id) => String(id) === String(user._id)
  );

  if (already) {
    review.helpful = Math.max(review.helpful - 1, 0);
    review.helpfulBy = review.helpfulBy.filter(
      (id) => String(id) !== String(user._id)
    );
  } else {
    review.helpful += 1;
    review.helpfulBy.push(user._id);
  }
  await review.save();
  return review;
}

export {
  listProductReviews,
  listAllReviews,
  createReview,
  updateReview,
  deleteReview,
  moderateReview,
  toggleHelpful,
};
