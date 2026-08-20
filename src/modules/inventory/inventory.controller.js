import asyncHandler from "../../utils/asyncHandler.js";
import { sendResponse } from "../../utils/ApiResponse.js";
import * as inventoryService from "./inventory.service.js";

const listHistory = asyncHandler(async (req, res) => {
  const { entries, meta } = await inventoryService.listHistory(req.query);
  return sendResponse(res, 200, "Inventory history fetched successfully.", entries, meta);
});

const adjustStock = asyncHandler(async (req, res) => {
  const product = await inventoryService.adjustStock(
    req.params.productId,
    req.body.adjustment,
    req.body.reason,
    req.user?.name || "Admin"
  );
  return sendResponse(res, 200, "Stock adjusted successfully.", product);
});

const listLowStock = asyncHandler(async (req, res) => {
  const result = await inventoryService.listLowStock(req.query);
  return sendResponse(res, 200, "Low stock products fetched successfully.", result);
});

export { listHistory, adjustStock, listLowStock };
