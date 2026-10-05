/**
 * Production Centralized Error Handling Middleware
 * ------------------------------------------------
 * Catches all sync/async application errors, logs diagnostic information safely
 * without leaking credentials, database internals, or tokens, and responds with
 * standard, secure HTTP status codes.
 */

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || err.status || 500;
  let code = err.code || (statusCode >= 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR");
  let safeMessage = err.message || "An unexpected error occurred.";

  // 1. Prisma Known Request Errors
  if (err.code && typeof err.code === "string" && err.code.startsWith("P")) {
    switch (err.code) {
      case "P2002":
        statusCode = 409;
        code = "RESOURCE_CONFLICT";
        safeMessage = "A record with this identifier already exists.";
        break;
      case "P2025":
        statusCode = 404;
        code = "RESOURCE_NOT_FOUND";
        safeMessage = "The requested resource could not be found.";
        break;
      case "P2003":
        statusCode = 400;
        code = "FOREIGN_KEY_VIOLATION";
        safeMessage = "Invalid relation or reference constraint in request.";
        break;
      case "P1001":
      case "P1002":
      case "P1017":
        statusCode = 503;
        code = "DATABASE_UNAVAILABLE";
        safeMessage = "Database service is temporarily unavailable. Please try again shortly.";
        break;
      default:
        statusCode = 500;
        code = "DATABASE_ERROR";
        safeMessage = "A database operation failed.";
        break;
    }
  }

  // 2. CORS Policy Violations
  if (err.message && err.message.includes("CORS policy violation")) {
    statusCode = 403;
    code = "CORS_FORBIDDEN";
    safeMessage = "Cross-Origin request blocked by security policy.";
  }

  // 3. Payload Too Large (DoS Protection)
  if (err.type === "entity.too.large" || err.statusCode === 413) {
    statusCode = 413;
    code = "PAYLOAD_TOO_LARGE";
    safeMessage = "Request payload exceeds maximum allowed size (500KB).";
  }

  // 4. Malformed JSON
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    statusCode = 400;
    code = "INVALID_JSON";
    safeMessage = "Malformed JSON payload provided in request.";
  }

  // 5. Production sanitization: Never leak internal error details or stack traces on 500+
  const isProduction = process.env.NODE_ENV === "production";
  if (statusCode >= 500 && isProduction) {
    safeMessage = "An unexpected internal server error occurred.";
  }

  // Safe structured logging (avoids logging passwords, secrets, or tokens)
  console.error(
    JSON.stringify({
      level: "error",
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode,
      code,
      message: err.message || safeMessage,
      stack: isProduction ? undefined : err.stack,
    }),
  );

  res.status(statusCode).json({
    success: false,
    code,
    error: safeMessage,
    ...(err.details && statusCode < 500 ? { details: err.details } : {}),
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
