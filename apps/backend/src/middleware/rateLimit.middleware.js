/**
 * Centralized sliding-window rate limiter for production endpoints
 * Mitigates brute-force attacks, credential stuffing, scraping, and resource exhaustion.
 */

function createRateLimiter({
  windowMs = 15 * 60 * 1000,
  max = 15,
  message = "Too many requests. Please try again later.",
  keyGenerator = null,
} = {}) {
  const hits = new Map();

  // Periodic cleanup of expired entries
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (record.resetTime <= now) {
        hits.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req, res, next) => {
    // In test environment, skip throttling unless explicitly tested
    if (process.env.NODE_ENV === "test" && !req.headers["x-test-rate-limit"]) {
      return next();
    }

    const ip =
      req.ip ||
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "127.0.0.1";

    const key = keyGenerator
      ? keyGenerator(req, ip)
      : `${req.baseUrl || ""}${req.path}:${ip}`;

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

/**
 * Strict limiter for sensitive authentication endpoints (signup, signin, change-password)
 */
const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: "Too many authentication attempts. Please wait 15 minutes before trying again.",
});

/**
 * Global rate limiter for standard public API endpoints to prevent scraping and DoS
 */
const globalApiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: "Too many requests to flowCTRL API. Please slow down and try again later.",
  keyGenerator: (req, ip) => `global:${ip}`,
});

/**
 * Mutation rate limiter for user profile and session updates
 */
const userMutationRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: "Too many account modification requests. Please wait a few minutes before trying again.",
});

module.exports = {
  createRateLimiter,
  authRateLimiter,
  globalApiRateLimiter,
  userMutationRateLimiter,
};
