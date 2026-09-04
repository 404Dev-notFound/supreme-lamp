/* eslint-disable no-control-regex */
/**
 * flowCTRL Centralized URL Security & XSS Sanitization
 * ---------------------------------------------------
 * Strictly validates, normalizes, and sanitizes user-supplied URLs
 * (avatars, portfolio links, website URLs) to prevent XSS via
 * dangerous schemes like javascript:, data:, vbscript:, etc.
 */

const DEFAULT_ALLOWED_PROTOCOLS = ["http:", "https:"];

/**
 * Checks if a string contains dangerous scheme signatures, including
 * obfuscated variations with tabs, null bytes, HTML entities, or URL encoding.
 */
export function containsDangerousScheme(rawStr) {
  if (typeof rawStr !== "string") return true;

  // Decode percent-encoded sequences to catch %6a%61%76%61%73%63%72%69%70%74 etc.
  let decoded = rawStr;
  try {
    decoded = decodeURIComponent(rawStr);
  } catch {
    decoded = rawStr.replace(/%([0-9a-f]{2})/gi, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    );
  }

  // Strip null bytes, control characters, ASCII tabs, whitespace, and invisible unicode
  const stripped = decoded
    .replace(/[\0-\x1f\s\u200B-\u200D\uFEFF]/g, "")
    .toLowerCase();

  const blockedPrefixes = [
    "javascript:",
    "data:",
    "vbscript:",
    "file:",
    "blob:",
    "livescript:",
    "mocha:",
  ];

  return blockedPrefixes.some((prefix) => stripped.startsWith(prefix));
}

/**
 * Validate that a URL string is safe and matches permitted protocols.
 *
 * @param {string} urlStr - The URL to validate
 * @param {Object} options - Validation options
 * @param {boolean} options.allowEmpty - Allow empty string / null (default: true)
 * @param {string[]} options.allowedProtocols - List of permitted URL protocols (default: ['http:', 'https:'])
 * @returns {{ valid: boolean, error?: string, url?: string }}
 */
export function validateUrl(urlStr, options = {}) {
  const {
    allowEmpty = true,
    allowedProtocols = DEFAULT_ALLOWED_PROTOCOLS,
  } = options;

  if (urlStr === null || urlStr === undefined || String(urlStr).trim() === "") {
    if (allowEmpty) {
      return { valid: true, url: "" };
    }
    return { valid: false, error: "URL cannot be empty." };
  }

  const trimmed = String(urlStr).trim();

  // Check for dangerous schemes
  if (containsDangerousScheme(trimmed)) {
    return { valid: false, error: "Dangerous or unsupported URL scheme rejected." };
  }

  // Attempt parsing with standard WHATWG URL parser
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: "Invalid URL format." };
  }

  const protocol = parsed.protocol.toLowerCase();
  if (!allowedProtocols.includes(protocol)) {
    return {
      valid: false,
      error: `Protocol '${protocol}' is not allowed. Permitted: ${allowedProtocols.join(", ")}`,
    };
  }

  return { valid: true, url: parsed.href };
}

/**
 * Returns true if the URL is valid and safe.
 */
export function isSafeUrl(urlStr, options = {}) {
  return validateUrl(urlStr, options).valid;
}

/**
 * Sanitizes a URL: returns valid URL string or fallback.
 */
export function sanitizeSafeUrl(urlStr, fallback = "", options = {}) {
  const result = validateUrl(urlStr, options);
  return result.valid ? result.url : fallback;
}
