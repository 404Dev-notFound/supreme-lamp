const crypto = require("crypto");

/**
 * Attaches a unique request ID (UUIDv4) to every request
 * and propagates it via the 'X-Request-Id' response header.
 */
function requestIdMiddleware(req, res, next) {
  const existingId = req.headers["x-request-id"];
  const requestId =
    typeof existingId === "string" && /^[a-zA-Z0-9_-]{8,64}$/.test(existingId)
      ? existingId
      : crypto.randomUUID();

  req.id = requestId;
  res.setHeader("X-Request-Id", requestId);
  next();
}

module.exports = { requestIdMiddleware };
