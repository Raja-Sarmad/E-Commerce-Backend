import asyncHandler from "../../utils/asyncHandler.js";
import { sendResponse } from "../../utils/ApiResponse.js";
import * as logService from "./logs.service.js";

const listLogs = asyncHandler(async (req, res) => {
  const { logs, meta } = await logService.listLogs(req.query);
  return sendResponse(res, 200, "Logs fetched successfully.", logs, meta);
});

const clearLogs = asyncHandler(async (_req, res) => {
  await logService.clearLogs();
  return sendResponse(res, 200, "Logs cleared successfully.");
});

export { listLogs, clearLogs };
