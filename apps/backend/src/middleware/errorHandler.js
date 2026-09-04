/**
 * Centralized Error Handling Middleware for Express
 * Prevents leaking sensitive stack traces or internal secrets to clients in production.
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === "production";

  // Structured server log for observability
  console.error(
    JSON.stringify({
      level: "error",
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode,
      message: err.message || "Internal Server Error",
      stack: isProduction ? undefined : err.stack,
    }),
  );

  res.status(statusCode).json({
    success: false,
    error: {
      message:
        statusCode === 500 && isProduction
          ? "An unexpected internal server error occurred."
          : err.message || "Internal Server Error",
      ...(isProduction ? {} : { stack: err.stack }),
    },
  });
}

/**
 * 404 Not Found Middleware
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: {
      message: `Resource not found: ${req.method} ${req.originalUrl || req.url}`,
    },
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
