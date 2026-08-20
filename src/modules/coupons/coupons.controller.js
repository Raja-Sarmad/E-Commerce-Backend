import asyncHandler from "../../utils/asyncHandler.js";
import { sendResponse } from "../../utils/ApiResponse.js";
import * as couponService from "./coupons.service.js";

const listCoupons = asyncHandler(async (req, res) => {
  const { coupons, meta } = await couponService.listCoupons(req.query);
  return sendResponse(res, 200, "Coupons fetched successfully.", coupons, meta);
});

const getCouponById = asyncHandler(async (req, res) => {
  const coupon = await couponService.getCouponById(req.params.id);
  return sendResponse(res, 200, "Coupon fetched successfully.", coupon);
});

const validateCoupon = asyncHandler(async (req, res) => {
  const { coupon, discount } = await couponService.validateCoupon(req.body.code, {
    subtotal: req.body.subtotal,
    userId: req.user?._id,
  });
  return sendResponse(res, 200, "Coupon applied successfully.", { coupon: coupon.code, discount });
});

const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponService.createCoupon(req.body);
  return sendResponse(res, 201, "Coupon created successfully.", coupon);
});

const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponService.updateCoupon(req.params.id, req.body);
  return sendResponse(res, 200, "Coupon updated successfully.", coupon);
});

const deleteCoupon = asyncHandler(async (req, res) => {
  await couponService.deleteCoupon(req.params.id);
  return sendResponse(res, 200, "Coupon deleted successfully.");
});

export {
  listCoupons,
  getCouponById,
  validateCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};
