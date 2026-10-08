/**
 * Standard API Response Utilities
 * Ensures uniform structure across all flowCTRL API endpoints:
 * {
 *   success: true | false,
 *   data?: any,
 *   message?: string,
 *   error?: string,
 *   code?: string,
 *   details?: any,
 *   meta?: object,
 *   requestId?: string
 * }
 */

function successResponse(res, {
  data = null,
  message = null,
  statusCode = 200,
  meta = null,
  req = null,
} = {}) {
  const payload = {
    success: true,
  };

  if (message) payload.message = message;
  if (data !== null) payload.data = data;
  if (meta) payload.meta = meta;

  const reqId = req?.id || res?.getHeader?.("x-request-id");
  if (reqId) payload.requestId = reqId;

  return res.status(statusCode).json(payload);
}

function errorResponse(res, {
  error = "An unexpected error occurred.",
  code = "REQUEST_ERROR",
  statusCode = 400,
  details = null,
  req = null,
} = {}) {
  const payload = {
    success: false,
    code,
    error,
  };

  if (details && (process.env.NODE_ENV !== "production" || statusCode < 500)) {
    payload.details = details;
  }

  const reqId = req?.id || res?.getHeader?.("x-request-id");
  if (reqId) payload.requestId = reqId;

  return res.status(statusCode).json(payload);
}

module.exports = {
  successResponse,
  errorResponse,
};
