/**
 * Custom API error. Controllers can `throw new ApiError(404, 'Not found')`
 * and the global error middleware will serialize it for the client.
 */
class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Wraps async route handlers so thrown errors forward to Express.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { ApiError, asyncHandler };
