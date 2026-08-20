import asyncHandler from "../../utils/asyncHandler.js";
import { sendResponse } from "../../utils/ApiResponse.js";
import * as orderService from "./orders.service.js";

const createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.user._id, req.body);
  return sendResponse(res, 201, "Order placed successfully.", order);
});

const listMyOrders = asyncHandler(async (req, res) => {
  const { orders, meta } = await orderService.listMyOrders(req.user._id, req.query);
  return sendResponse(res, 200, "Orders fetched successfully.", orders, meta);
});

const getMyOrderByNumber = asyncHandler(async (req, res) => {
  const order = await orderService.getMyOrderByNumber(req.user._id, req.params.number);
  return sendResponse(res, 200, "Order fetched successfully.", order);
});

const cancelOrder = asyncHandler(async (req, res) => {
  const order = await orderService.cancelOrder(req.user._id, req.params.id, req.body.reason);
  return sendResponse(res, 200, "Order cancelled successfully.", order);
});

/* ── Admin ──────────────────────────────────────────────────── */
const listAllOrders = asyncHandler(async (req, res) => {
  const { orders, meta } = await orderService.listAllOrders(req.query);
  return sendResponse(res, 200, "Orders fetched successfully.", orders, meta);
});

const getOrderByNumber = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderByNumber(req.params.number);
  return sendResponse(res, 200, "Order fetched successfully.", order);
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderStatus(req.params.id, req.body.status, req.body.note);
  return sendResponse(res, 200, "Order status updated successfully.", order);
});

const addTracking = asyncHandler(async (req, res) => {
  const order = await orderService.addTracking(req.params.id, req.body);
  return sendResponse(res, 200, "Tracking updated successfully.", order);
});

export {
  createOrder,
  listMyOrders,
  getMyOrderByNumber,
  cancelOrder,
  listAllOrders,
  getOrderByNumber,
  updateOrderStatus,
  addTracking,
};
