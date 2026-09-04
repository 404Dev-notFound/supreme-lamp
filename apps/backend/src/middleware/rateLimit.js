/**
 * Centralized in-memory sliding-window rate limiter for sensitive auth routes
 */

function createRateLimiter({ windowMs = 15 * 60 * 1000, max = 20, message = "Too many requests. Please try again later." } = {}) {
  const hits = new Map();

  // Periodic cleanup every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (record.resetTime <= now) {
        hits.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req, res, next) => {
    // In test environment, do not throttle
    if (process.env.NODE_ENV === "test") {
      return next();
    }

    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "127.0.0.1";

    const key = `${req.path}:${ip}`;
    const now = Date.now();

    const record = hits.get(key) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowMs;
    }

    record.count++;
    hits.set(key, record);

    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - record.count));
    res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      return res.status(429).json({
        success: false,
        code: "RATE_LIMIT_EXCEEDED",
        error: message,
      });
    }

    next();
  };
}

const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: "Too many authentication attempts. Please wait 15 minutes before trying again.",
});

module.exports = {
  createRateLimiter,
  authRateLimiter,
};
