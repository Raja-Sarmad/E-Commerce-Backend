import asyncHandler from "../../utils/asyncHandler.js";
import { sendResponse } from "../../utils/ApiResponse.js";
import * as analyticsService from "./analytics.service.js";

const getOverview = asyncHandler(async (_req, res) => {
  const data = await analyticsService.getOverview();
  return sendResponse(res, 200, "Dashboard overview fetched successfully.", data);
});

const getRevenueSeries = asyncHandler(async (req, res) => {
  const data = await analyticsService.getRevenueSeries(Number(req.query.months) || 8);
  return sendResponse(res, 200, "Revenue series fetched successfully.", data);
});

const getSalesByCategory = asyncHandler(async (_req, res) => {
  const data = await analyticsService.getSalesByCategory();
  return sendResponse(res, 200, "Sales by category fetched successfully.", data);
});

const getDailyOrders = asyncHandler(async (req, res) => {
  const data = await analyticsService.getDailyOrders(Number(req.query.days) || 7);
  return sendResponse(res, 200, "Daily orders fetched successfully.", data);
});

const getTopProducts = asyncHandler(async (req, res) => {
  const data = await analyticsService.getTopProducts(Number(req.query.limit) || 5);
  return sendResponse(res, 200, "Top products fetched successfully.", data);
});

const getLowStockProducts = asyncHandler(async (req, res) => {
  const data = await analyticsService.getLowStockProducts(Number(req.query.limit) || 5);
  return sendResponse(res, 200, "Low stock products fetched successfully.", data);
});

const getRecentOrders = asyncHandler(async (req, res) => {
  const data = await analyticsService.getRecentOrders(Number(req.query.limit) || 6);
  return sendResponse(res, 200, "Recent orders fetched successfully.", data);
});

const getRecentReviews = asyncHandler(async (req, res) => {
  const data = await analyticsService.getRecentReviews(Number(req.query.limit) || 5);
  return sendResponse(res, 200, "Recent reviews fetched successfully.", data);
});

const getRecentNotifications = asyncHandler(async (req, res) => {
  const data = await analyticsService.getRecentNotifications(Number(req.query.limit) || 5);
  return sendResponse(res, 200, "Recent notifications fetched successfully.", data);
});

const getRecentActivity = asyncHandler(async (req, res) => {
  const data = await analyticsService.getRecentActivity(Number(req.query.limit) || 8);
  return sendResponse(res, 200, "Recent activity fetched successfully.", data);
});

const getRevenueComparison = asyncHandler(async (_req, res) => {
  const data = await analyticsService.getRevenueComparison();
  return sendResponse(res, 200, "Revenue comparison fetched successfully.", data);
});

export {
  getOverview,
  getRevenueSeries,
  getSalesByCategory,
  getDailyOrders,
  getTopProducts,
  getLowStockProducts,
  getRecentOrders,
  getRecentReviews,
  getRecentNotifications,
  getRecentActivity,
  getRevenueComparison,
};
