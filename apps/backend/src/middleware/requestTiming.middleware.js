/**
 * Request Timing Middleware
 * -------------------------
 * Measures HTTP request processing duration and attaches the 'X-Response-Time' header.
 * Provides microsecond-precision diagnostics for server performance and tracing.
 */
function requestTimingMiddleware(req, res, next) {
  const start = process.hrtime.bigint();

  const originalWriteHead = res.writeHead;
  res.writeHead = function (...args) {
    if (!res.headersSent) {
      const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
      res.setHeader("X-Response-Time", `${elapsedMs.toFixed(2)}ms`);
    }
    return originalWriteHead.apply(this, args);
  };

  next();
}

module.exports = { requestTimingMiddleware };

