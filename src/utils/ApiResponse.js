/**
 * ApiResponse — standard envelope for every successful response.
 * Shape: { success: true, statusCode, message, data, meta?, accessToken? }
 */
class ApiResponse {
  constructor(statusCode, message, data, meta = undefined, accessToken = undefined) {
    this.success = true;
    this.statusCode = statusCode;
    this.message = message;
    if (data !== undefined) this.data = data;
    if (meta !== undefined) this.meta = meta;
    if (accessToken !== undefined) this.accessToken = accessToken;
  }
}

/**
 * Helper to send a success response.
 */
const sendResponse = (res, statusCode, message, data, meta, accessToken) => {
  const payload = new ApiResponse(statusCode, message, data, meta, accessToken);
  return res.status(statusCode).json(payload);
};

export { ApiResponse, sendResponse };
