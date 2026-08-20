import jwt from "jsonwebtoken";
import config from "../config/index.js";
import AppError from "./AppError.js";

/**
 * Sign an access token (short-lived).
 * @param {{ _id: string, role: string }} payload
 */
function signAccessToken(payload) {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  });
}

/**
 * Sign a refresh token (long-lived).
 */
function signRefreshToken(payload) {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
}

/**
 * Verify an access token. Throws AppError(401) on failure.
 */
function verifyAccessToken(token) {
  try {
    return jwt.verify(token, config.jwt.accessSecret);
  } catch {
    throw new AppError("Invalid or expired access token.", 401);
  }
}

/**
 * Verify a refresh token. Throws AppError(401) on failure.
 */
function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, config.jwt.refreshSecret);
  } catch {
    throw new AppError("Invalid or expired refresh token.", 401);
  }
}

/**
 * Sign one-time tokens (email verification, password reset).
 */
function signOtpToken(payload, expiresIn = "1h") {
  return jwt.sign(payload, config.jwt.accessSecret, { expiresIn });
}

function verifyOtpToken(token) {
  try {
    return jwt.verify(token, config.jwt.accessSecret);
  } catch {
    throw new AppError("Token is invalid or has expired.", 400);
  }
}

export {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  signOtpToken,
  verifyOtpToken,
};
