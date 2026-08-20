import asyncHandler from "../../utils/asyncHandler.js";
import { sendResponse } from "../../utils/ApiResponse.js";
import * as settingsService from "./settings.service.js";

const getSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.getSettings();
  return sendResponse(res, 200, "Settings fetched successfully.", settings);
});

const updateSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.updateSettings(req.body);
  return sendResponse(res, 200, "Settings updated successfully.", settings);
});

const updateEmailTemplate = asyncHandler(async (req, res) => {
  const templates = await settingsService.updateEmailTemplate(req.params.name, req.body);
  return sendResponse(res, 200, "Email template updated successfully.", templates);
});

export { getSettings, updateSettings, updateEmailTemplate };
