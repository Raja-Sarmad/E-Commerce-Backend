import config from "../config/index.js";
import AppError from "../utils/AppError.js";

/**
 * 404 handler — must be mounted after all routes.
 */
const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

/**
 * Global error handler — the single place every error converges to.
 * - Operational AppError  -> predictable status/message
 * - Mongoose CastError/Validation -> 400
 * - Multer errors -> 400
 * - Duplicate key -> 409
 * - JWT errors -> 401
 * - Anything else -> 500 (generic message in prod, full detail in dev)
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message || "Internal server error";

  if (err.name === "CastError") {
    error = new AppError(`Invalid ${err.path}: ${err.value}`, 400);
  }

  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    error = new AppError(messages.join(", "), 400);
  }

  if (err.name === "MulterError") {
    error = new AppError(err.message, 400);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    error = new AppError(`Duplicate value for '${field}'. Already exists.`, 409);
  }

  if (err.name === "TokenExpiredError") {
    error = new AppError("Token has expired. Please authenticate again.", 401);
  }

  if (err.name === "JsonWebTokenError") {
    error = new AppError("Invalid token. Please authenticate again.", 401);
  }

  const finalCode =
    error.statusCode >= 400 && error.statusCode <= 599 ? error.statusCode : 500;

  console.error(
    `[error] ${req.method} ${req.originalUrl} ->`,
    err.stack || err.message
  );

  return res.status(finalCode).json({
    success: false,
    statusCode: finalCode,
    message: error.message || "Something went wrong. Please try again later.",
    details: error.details,
    stack: config.isProd ? undefined : error.stack,
  });
};

export { notFoundHandler, errorHandler };
