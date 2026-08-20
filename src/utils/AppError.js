/**
 * AppError — operational error carrying an HTTP status code.
 * Used everywhere via `next(new AppError(...))` and caught by the
 * central error handler in `src/middlewares/errorMiddleware.js`.
 */
class AppError extends Error {
  constructor(message, statusCode = 500, details = undefined) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
