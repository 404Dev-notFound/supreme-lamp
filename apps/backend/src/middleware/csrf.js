const { parseCookies, CSRF_COOKIE_NAME } = require("../utils/sessionCookie");

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const ALLOWED_ORIGINS = new Set([
  "http://localhost:3000",
  "http://localhost:5000",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5000",
  process.env.APP_URL,
  process.env.FRONTEND_URL,
  process.env.NEXTAUTH_URL,
].filter(Boolean));

function csrfProtection(req, res, next) {
  // Safe HTTP methods do not require CSRF validation
  if (SAFE_METHODS.has(req.method.toUpperCase())) {
    return next();
  }

  // Verify Origin / Referer
  const origin = req.headers.origin || req.headers.referer;
  let isOriginValid = false;

  if (origin) {
    try {
      const originUrl = new URL(origin).origin;
      if (ALLOWED_ORIGINS.has(originUrl)) {
        isOriginValid = true;
      }
    } catch {
      isOriginValid = false;
    }
  } else {
    // If no origin/referer header (e.g. server-to-server or test agent), allow if CSRF header is present or in non-browser mode
    if (process.env.NODE_ENV === "test" || !req.headers.cookie) {
      isOriginValid = true;
    }
  }

  if (!isOriginValid) {
    return res.status(403).json({
      success: false,
      code: "CSRF_FAILED",
      error: "Untrusted origin for state-changing request.",
    });
  }

  // If client has a CSRF cookie, verify double-submit header
  const cookies = parseCookies(req.headers.cookie);
  const expectedCsrfToken = cookies[CSRF_COOKIE_NAME];
  const clientCsrfHeader = req.headers["x-flowctrl-csrf"];

  if (expectedCsrfToken) {
    if (!clientCsrfHeader || clientCsrfHeader !== expectedCsrfToken) {
      return res.status(403).json({
        success: false,
        code: "CSRF_FAILED",
        error: "Missing or invalid CSRF token header.",
      });
    }
  }

  next();
}

module.exports = { csrfProtection };
