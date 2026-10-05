/**
 * Centralized Error Handling Middleware
 * ---------------------------------------
 * Catches all sync/async application errors, logs diagnostic information safely
 * without leaking credentials or tokens, and responds with a standardized, safe format.
 */

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === "production";
  const code = err.code || (statusCode >= 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR");

  // Log error safely without leaking sensitive bodies (passwords, tokens)
  console.error(
    JSON.stringify({
      level: "error",
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode,
      code,
      message: err.message || "Internal Server Error",
      stack: isProduction ? undefined : err.stack,
    }),
  );

  const safeMessage =
    statusCode >= 500 && isProduction
      ? "An unexpected internal server error occurred."
      : err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    code,
    error: safeMessage,
    ...(err.details ? { details: err.details } : {}),
  });
}

function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    code: "NOT_FOUND",
    error: `Resource not found: ${req.method} ${req.originalUrl || req.url}`,
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
