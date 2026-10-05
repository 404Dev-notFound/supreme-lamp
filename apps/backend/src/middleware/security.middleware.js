/**
 * Production Security Middlewares for flowCTRL
 * -------------------------------------------
 * Defense-in-depth protection against:
 * - Prototype Pollution
 * - HTTP Parameter Pollution (HPP)
 * - Host Header Injection
 * - Null-Byte / Control Character Injection
 * - Slowloris / Connection Exhaustion
 */

const config = require("../config");

/**
 * Forbidden prototype pollution property names
 */
const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/**
 * Recursively scans and cleans objects from prototype pollution keys
 */
function cleanObject(obj, depth = 0) {
  if (depth > 15 || !obj || typeof obj !== "object") {
    return false;
  }

  let foundPollution = false;

  for (const key of Object.getOwnPropertyNames(obj)) {
    if (FORBIDDEN_KEYS.has(key)) {
      delete obj[key];
      foundPollution = true;
      continue;
    }

    const val = obj[key];
    if (typeof val === "string") {
      // Null-byte injection check
      if (val.includes("\0")) {
        obj[key] = val.replace(/\0/g, "");
      }
    } else if (typeof val === "object" && val !== null) {
      if (cleanObject(val, depth + 1)) {
        foundPollution = true;
      }
    }
  }

  return foundPollution;
}

/**
 * 1. Prototype Pollution & Null-Byte Guard
 */
function prototypePollutionGuard(req, res, next) {
  try {
    let polluted = false;

    if (req.body && typeof req.body === "object") {
      if (cleanObject(req.body)) polluted = true;
    }

    if (req.query && typeof req.query === "object") {
      if (cleanObject(req.query)) polluted = true;
    }

    if (req.params && typeof req.params === "object") {
      if (cleanObject(req.params)) polluted = true;
    }

    if (polluted) {
      return res.status(400).json({
        success: false,
        code: "INVALID_PAYLOAD",
        error: "Unsafe property or parameter signature detected.",
      });
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * 2. HTTP Parameter Pollution (HPP) Guard
 * Ensures single-value query parameters are not polluted into arrays.
 */
function hppGuard(options = {}) {
  const whitelist = new Set(options.whitelist || ["skills", "tags", "categories"]);

  return (req, res, next) => {
    if (req.query && typeof req.query === "object") {
      for (const [key, value] of Object.entries(req.query)) {
        if (Array.isArray(value) && !whitelist.has(key)) {
          // Flatten array to last scalar value to avoid type confusion vulnerabilities
          req.query[key] = String(value[value.length - 1]);
        }
      }
    }
    next();
  };
}

/**
 * 3. Host Header Validation Guard
 * Protects against Host Header Injection and cache poisoning.
 */
function hostHeaderGuard(req, res, next) {
  const host = req.headers.host;

  if (!host || typeof host !== "string") {
    return res.status(400).json({
      success: false,
      code: "INVALID_HOST",
      error: "Missing or invalid Host header.",
    });
  }

  // Reject CRLF, control characters, or spaces in Host header
  if (/[\r\n\t\s]/.test(host)) {
    return res.status(400).json({
      success: false,
      code: "INVALID_HOST",
      error: "Malformed Host header detected.",
    });
  }

  const hostname = host.split(":")[0].toLowerCase();

  // Allow standard development and production hostnames
  const allowedHostnames = new Set([
    "localhost",
    "127.0.0.1",
    "::1",
    "backend",
    "frontend",
  ]);

  // Add hosts from CORS allowed origins
  if (config.cors?.allowedOrigins) {
    for (const origin of config.cors.allowedOrigins) {
      try {
        const u = new URL(origin);
        allowedHostnames.add(u.hostname.toLowerCase());
      } catch {
        // ignore invalid URL strings in origin list
      }
    }
  }

  // Allow if in allowed list or in development / test
  if (config.isTest || allowedHostnames.has(hostname) || hostname.endsWith(".flowctrl.dev") || hostname.endsWith(".netlify.app") || hostname.endsWith(".vercel.app")) {
    return next();
  }

  return res.status(400).json({
    success: false,
    code: "INVALID_HOST",
    error: "Host header not recognized.",
  });
}

/**
 * 4. Request Timeout Guard
 * Mitigates Slowloris and connection starvation attacks.
 */
function requestTimeoutGuard(timeoutMs = 15000) {
  return (req, res, next) => {
    // Skip in test environment to avoid timeouts on debug runs
    if (config.isTest) return next();

    res.setTimeout(timeoutMs, () => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          code: "REQUEST_TIMEOUT",
          error: "Request timed out while waiting for processing.",
        });
      }
    });

    next();
  };
}

module.exports = {
  prototypePollutionGuard,
  hppGuard,
  hostHeaderGuard,
  requestTimeoutGuard,
};
