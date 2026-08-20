/**
 * asyncHandler — wraps async route handlers so that rejected promises
 * are forwarded to the central Express error handler (no try/catch needed).
 *
 * @param {Function} fn async route handler
 * @returns {Function} express middleware
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
