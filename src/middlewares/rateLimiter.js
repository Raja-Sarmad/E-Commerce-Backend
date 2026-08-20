import rateLimit from "express-rate-limit";
import config from "../config/index.js";

/**
 * Global API limiter.
 */
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: "Too many requests. Please try again later.",
  },
});

/**
 * Stricter limiter for auth endpoints (login, register, reset, etc.).
 */
const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: "Too many authentication attempts. Please try again later.",
  },
});

/**
 * Very strict limiter for password reset (brute-force protection).
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: "Too many reset attempts. Please try again in an hour.",
  },
});

export { apiLimiter, authLimiter, passwordResetLimiter };
