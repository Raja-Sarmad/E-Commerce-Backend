import asyncHandler from "../../utils/asyncHandler.js";
import { sendResponse } from "../../utils/ApiResponse.js";
import * as shippingService from "./shipping.service.js";

const listZones = asyncHandler(async (req, res) => {
  const zones = await shippingService.listZones(req.query);
  return sendResponse(res, 200, "Shipping zones fetched successfully.", zones);
});
const getZone = asyncHandler(async (req, res) => {
  const zone = await shippingService.getZone(req.params.id);
  return sendResponse(res, 200, "Shipping zone fetched successfully.", zone);
});
const createZone = asyncHandler(async (req, res) => {
  const zone = await shippingService.createZone(req.body);
  return sendResponse(res, 201, "Shipping zone created successfully.", zone);
});
const updateZone = asyncHandler(async (req, res) => {
  const zone = await shippingService.updateZone(req.params.id, req.body);
  return sendResponse(res, 200, "Shipping zone updated successfully.", zone);
});
const deleteZone = asyncHandler(async (req, res) => {
  await shippingService.deleteZone(req.params.id);
  return sendResponse(res, 200, "Shipping zone deleted successfully.");
});

const listMethods = asyncHandler(async (req, res) => {
  const methods = await shippingService.listMethods(req.query);
  return sendResponse(res, 200, "Shipping methods fetched successfully.", methods);
});
const getMethod = asyncHandler(async (req, res) => {
  const method = await shippingService.getMethod(req.params.id);
  return sendResponse(res, 200, "Shipping method fetched successfully.", method);
});
const createMethod = asyncHandler(async (req, res) => {
  const method = await shippingService.createMethod(req.body);
  return sendResponse(res, 201, "Shipping method created successfully.", method);
});
const updateMethod = asyncHandler(async (req, res) => {
  const method = await shippingService.updateMethod(req.params.id, req.body);
  return sendResponse(res, 200, "Shipping method updated successfully.", method);
});
const deleteMethod = asyncHandler(async (req, res) => {
  await shippingService.deleteMethod(req.params.id);
  return sendResponse(res, 200, "Shipping method deleted successfully.");
});

export {
  listZones, getZone, createZone, updateZone, deleteZone,
  listMethods, getMethod, createMethod, updateMethod, deleteMethod,
};
