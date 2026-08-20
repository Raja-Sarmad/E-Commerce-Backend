import asyncHandler from "../../utils/asyncHandler.js";
import { sendResponse } from "../../utils/ApiResponse.js";
import * as reportService from "./reports.service.js";

const salesReport = asyncHandler(async (req, res) => {
  const data = await reportService.salesReport(req.query);
  return sendResponse(res, 200, "Sales report generated.", data);
});

const inventoryReport = asyncHandler(async (_req, res) => {
  const data = await reportService.inventoryReport();
  return sendResponse(res, 200, "Inventory report generated.", data);
});

const customerReport = asyncHandler(async (req, res) => {
  const data = await reportService.customerReport(req.query);
  return sendResponse(res, 200, "Customer report generated.", data);
});

const paymentsReport = asyncHandler(async (_req, res) => {
  const data = await reportService.paymentsReport();
  return sendResponse(res, 200, "Payments report generated.", data);
});

const vendorReport = asyncHandler(async (_req, res) => {
  const data = await reportService.vendorReport();
  return sendResponse(res, 200, "Vendor report generated.", data);
});

export { salesReport, inventoryReport, customerReport, paymentsReport, vendorReport };
