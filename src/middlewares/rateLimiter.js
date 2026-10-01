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
  validate: { trustProxy: false },
  skip: (req) => {
    const path = String(req.originalUrl || req.url);
    // Never throttle the lightweight stock ping used by the storefront's
    // 15s live-stock polling — a full bucket otherwise freezes the UI on
    // stale stock values for the whole 15-minute window.
    const isStockPing =
      req.method === "GET" && path.startsWith(`${config.apiPrefix}/products/stock`);
    // Auth routes already use authLimiter — avoid double-counting login attempts.
    const isAuthRoute = path.startsWith(`${config.apiPrefix}/auth/`);
    return isStockPing || isAuthRoute;
  },
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
  validate: { trustProxy: false },
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
