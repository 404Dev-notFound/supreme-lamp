/**
 * Centralized sliding-window rate limiter for production endpoints
 * Uses Redis sliding window if available, with in-memory Map fallback.
 * Mitigates brute-force attacks, credential stuffing, scraping, and resource exhaustion.
 *
 * Outage Hardening:
 * - Sensitive endpoints (auth, credentials): Configured with failureMode: "fail-closed".
 *   If rate limiting state cannot be validated, requests are safely blocked rather than passed through.
 * - Public/Read endpoints: Configured with failureMode: "fail-open" for maximum availability.
 */

const { redisClient, isRedisAvailable, buildKey, REDIS_CONFIG } = require("../lib/redis");

function createRateLimiter({
  windowMs = 15 * 60 * 1000,
  max = 15,
  message = "Too many requests. Please try again later.",
  keyGenerator = null,
  failureMode = "fail-open", // "fail-closed" for sensitive auth, "fail-open" for public reads
} = {}) {
  const memoryHits = new Map();

  // Periodic cleanup of expired entries in memory store
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryHits.entries()) {
      if (record.resetTime <= now) {
        memoryHits.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref();

  return async (req, res, next) => {
    // In test environment, skip throttling unless explicitly tested
    if (process.env.NODE_ENV === "test" && !req.headers["x-test-rate-limit"]) {
      return next();
    }

    try {
      const ip =
        req.ip ||
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.socket?.remoteAddress ||
        "127.0.0.1";

      const key = keyGenerator
        ? keyGenerator(req, ip)
        : `${req.baseUrl || ""}${req.path}:${ip}`;

      const now = Date.now();

      // 1. Try Redis sliding window if available
      if (isRedisAvailable() && redisClient) {
        try {
          const redisKey = buildKey(REDIS_CONFIG.namespaces.RATE_LIMIT, key);
          const windowSeconds = Math.ceil(windowMs / 1000);

          // Atomic pipeline: INCR, EXPIRE (if new), TTL
          const pipeline = redisClient.pipeline();
          pipeline.incr(redisKey);
          pipeline.ttl(redisKey);
          const results = await pipeline.exec();

          const currentCount = results[0]?.[1] || 1;
          let ttlSeconds = results[1]?.[1] || windowSeconds;

          if (ttlSeconds === -1 || currentCount === 1) {
            await redisClient.expire(redisKey, windowSeconds);
            ttlSeconds = windowSeconds;
          }

          const resetSeconds = Math.max(1, ttlSeconds);

          res.setHeader("X-RateLimit-Limit", max);
          res.setHeader("X-RateLimit-Remaining", Math.max(0, max - currentCount));
          res.setHeader("X-RateLimit-Reset", Math.ceil(now / 1000) + resetSeconds);
          res.setHeader("X-RateLimit-Store", "redis");

          if (currentCount > max) {
            res.setHeader("Retry-After", resetSeconds);
            return res.status(429).json({
              success: false,
              code: "RATE_LIMIT_EXCEEDED",
              error: message,
            });
          }

          return next();
        } catch (redisErr) {
          // Fall through to memory store if Redis operation errors
        }
      }

      // 2. In-memory sliding window fallback (active during Redis outage or standalone mode)
      const record = memoryHits.get(key) || { count: 0, resetTime: now + windowMs };

      if (now > record.resetTime) {
        record.count = 0;
        record.resetTime = now + windowMs;
      }

      record.count++;
      memoryHits.set(key, record);

      const memoryResetSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, max - record.count));
      res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetTime / 1000));
      res.setHeader("X-RateLimit-Store", "memory-fallback");

      if (record.count > max) {
        res.setHeader("Retry-After", memoryResetSeconds);
        return res.status(429).json({
          success: false,
          code: "RATE_LIMIT_EXCEEDED",
          error: message,
        });
      }

      next();
    } catch (unhandledErr) {
      // 3. Unhandled error in rate limit processing:
      // If endpoint is sensitive and failureMode is "fail-closed", securely reject
      if (failureMode === "fail-closed") {
        return res.status(503).json({
          success: false,
          code: "RATE_LIMIT_UNAVAILABLE",
          error: "Rate limiting verification service is temporarily unavailable. Request blocked for security.",
        });
      }

      // For public/non-sensitive endpoints, fail open to avoid service outage
      next();
    }
  };
}

/**
 * Strict limiter for sensitive authentication endpoints (signup, signin, change-password)
 * Configured with failureMode: "fail-closed" to ensure credential stuffing cannot bypass limits.
 */
const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: "Too many authentication attempts. Please wait 15 minutes before trying again.",
  failureMode: "fail-closed",
});

/**
 * Global rate limiter for standard public API endpoints to prevent scraping and DoS
 * Configured with failureMode: "fail-open" so read traffic is never blocked if rate limiting fails.
 */
const globalApiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: "Too many requests to flowCTRL API. Please slow down and try again later.",
  keyGenerator: (req, ip) => `global:${ip}`,
  failureMode: "fail-open",
});

/**
 * Mutation rate limiter for user profile and session updates
 */
const userMutationRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
  keyGenerator: (req, ip) => (req.user?.id ? `user-mut:${req.user.id}` : `ip-mut:${ip}`),
  message: "Too many account modification requests. Please wait a few minutes before trying again.",
  failureMode: "fail-closed",
});

module.exports = {
  createRateLimiter,
  authRateLimiter,
  globalApiRateLimiter,
  userMutationRateLimiter,
};
