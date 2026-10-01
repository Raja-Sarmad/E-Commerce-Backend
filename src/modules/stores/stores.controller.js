import asyncHandler from "../../utils/asyncHandler.js";
import { sendResponse } from "../../utils/ApiResponse.js";
import * as storeService from "./stores.service.js";

const listStores = asyncHandler(async (_req, res) => {
  const stores = await storeService.listStores();
  return sendResponse(res, 200, "Stores fetched successfully.", stores);
});

export { listStores };
