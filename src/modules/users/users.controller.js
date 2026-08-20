import asyncHandler from "../../utils/asyncHandler.js";
import { sendResponse } from "../../utils/ApiResponse.js";
import * as userService from "./users.service.js";

const getProfile = asyncHandler(async (req, res) => {
  const profile = await userService.getProfile(req.user._id);
  return sendResponse(res, 200, "Profile fetched successfully.", profile);
});

const updateProfile = asyncHandler(async (req, res) => {
  const profile = await userService.updateProfile(req.user._id, req.body);
  return sendResponse(res, 200, "Profile updated successfully.", profile);
});

const updatePassword = asyncHandler(async (req, res) => {
  const profile = await userService.updatePassword(req.user._id, req.body);
  return sendResponse(res, 200, "Password updated successfully.", profile);
});

const listUsers = asyncHandler(async (req, res) => {
  const { users, meta } = await userService.listUsers(req.query);
  return sendResponse(res, 200, "Users fetched successfully.", users, meta);
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  return sendResponse(res, 200, "User fetched successfully.", user);
});

const updateUserByAdmin = asyncHandler(async (req, res) => {
  const user = await userService.updateUserByAdmin(req.params.id, req.body);
  return sendResponse(res, 200, "User updated successfully.", user);
});

const deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id);
  return sendResponse(res, 200, "User deleted successfully.");
});

const blockUser = asyncHandler(async (req, res) => {
  const user = await userService.blockUser(req.params.id, true);
  return sendResponse(res, 200, "User blocked successfully.", user);
});

const unblockUser = asyncHandler(async (req, res) => {
  const user = await userService.blockUser(req.params.id, false);
  return sendResponse(res, 200, "User unblocked successfully.", user);
});

export {
  getProfile,
  updateProfile,
  updatePassword,
  listUsers,
  getUserById,
  updateUserByAdmin,
  deleteUser,
  blockUser,
  unblockUser,
};
