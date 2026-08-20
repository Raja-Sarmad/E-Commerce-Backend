import asyncHandler from "../../utils/asyncHandler.js";
import { sendResponse } from "../../utils/ApiResponse.js";
import { setAuthCookies, clearAuthCookies } from "../../utils/cookie.js";
import * as authService from "./auth.service.js";
import config from "../../config/index.js";

const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.register(req.body);
  setAuthCookies(res, { accessToken, refreshToken });
  return sendResponse(res, 201, "Account created successfully. Please verify your email.", user);
});

const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);
  setAuthCookies(res, { accessToken, refreshToken });
  return sendResponse(res, 200, "Logged in successfully.", user);
});

const refresh = asyncHandler(async (req, res) => {
  const refreshToken =
    req.cookies[config.cookie.refreshName] ||
    (req.body && req.body.refreshToken) ||
    (req.headers["x-refresh-token"]);

  const { accessToken, refreshToken: newRefreshToken, user } = await authService.refresh(refreshToken);
  setAuthCookies(res, { accessToken, refreshToken: newRefreshToken });
  return sendResponse(res, 200, "Tokens refreshed successfully.", { user }, undefined, accessToken);
});

const logout = asyncHandler(async (req, res) => {
  if (req.user && req.user._id) {
    await authService.logout(req.user._id);
  }
  clearAuthCookies(res);
  return sendResponse(res, 200, "Logged out successfully.");
});

const verifyEmail = asyncHandler(async (req, res) => {
  const user = await authService.verifyEmail(req.params.token);
  return sendResponse(res, 200, "Email verified successfully.", user);
});

const resendVerification = asyncHandler(async (req, res) => {
  const result = await authService.resendVerificationEmail(req.body.email);
  return sendResponse(res, 200, "Verification email sent.", result);
});

const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);
  return sendResponse(
    res,
    200,
    "If an account exists with that email, a reset link has been sent.",
    result
  );
});

const resetPassword = asyncHandler(async (req, res) => {
  const { user } = await authService.resetPassword(req.params.token, req.body.newPassword);
  return sendResponse(res, 200, "Password reset successfully. You can now log in.", user);
});

export {
  register,
  login,
  refresh,
  logout,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
};
