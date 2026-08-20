import asyncHandler from "../../utils/asyncHandler.js";
import { sendResponse } from "../../utils/ApiResponse.js";
import * as vendorService from "./vendors.service.js";

const listVendors = asyncHandler(async (req, res) => {
  const { vendors, meta } = await vendorService.listVendors(req.query);
  return sendResponse(res, 200, "Vendors fetched successfully.", vendors, meta);
});

const getVendorById = asyncHandler(async (req, res) => {
  const vendor = await vendorService.getVendorById(req.params.id);
  return sendResponse(res, 200, "Vendor fetched successfully.", vendor);
});

const createVendor = asyncHandler(async (req, res) => {
  const vendor = await vendorService.createVendor(req.body);
  return sendResponse(res, 201, "Vendor application submitted.", vendor);
});

const updateVendor = asyncHandler(async (req, res) => {
  const vendor = await vendorService.updateVendor(req.params.id, req.body);
  return sendResponse(res, 200, "Vendor updated successfully.", vendor);
});

const setVendorStatus = asyncHandler(async (req, res) => {
  const vendor = await vendorService.setVendorStatus(req.params.id, req.body.status);
  return sendResponse(res, 200, "Vendor status updated successfully.", vendor);
});

const deleteVendor = asyncHandler(async (req, res) => {
  await vendorService.deleteVendor(req.params.id);
  return sendResponse(res, 200, "Vendor deleted successfully.");
});

export { listVendors, getVendorById, createVendor, updateVendor, setVendorStatus, deleteVendor };
