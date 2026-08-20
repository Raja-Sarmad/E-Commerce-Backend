import asyncHandler from "../../utils/asyncHandler.js";
import { sendResponse } from "../../utils/ApiResponse.js";
import * as roleService from "./roles.service.js";

const listRoles = asyncHandler(async (req, res) => {
  const { roles, meta } = await roleService.listRoles(req.query);
  return sendResponse(res, 200, "Roles fetched successfully.", roles, meta);
});

const getRoleById = asyncHandler(async (req, res) => {
  const role = await roleService.getRoleById(req.params.id);
  return sendResponse(res, 200, "Role fetched successfully.", role);
});

const createRole = asyncHandler(async (req, res) => {
  const role = await roleService.createRole(req.body);
  return sendResponse(res, 201, "Role created successfully.", role);
});

const updateRole = asyncHandler(async (req, res) => {
  const role = await roleService.updateRole(req.params.id, req.body);
  return sendResponse(res, 200, "Role updated successfully.", role);
});

const deleteRole = asyncHandler(async (req, res) => {
  await roleService.deleteRole(req.params.id);
  return sendResponse(res, 200, "Role deleted successfully.");
});

export { listRoles, getRoleById, createRole, updateRole, deleteRole };
