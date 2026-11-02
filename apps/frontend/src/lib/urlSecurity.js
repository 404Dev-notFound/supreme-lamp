/* eslint-disable no-control-regex */
/**
 * flowCTRL Centralized URL Security & XSS/SSRF Sanitization
 * --------------------------------------------------------
 * Strictly validates, normalizes, and sanitizes user-supplied URLs
 * (avatars, portfolio links, website URLs) to prevent XSS and SSRF via
 * dangerous schemes like javascript:, data:, vbscript:, and private IP ranges.
 */

const DEFAULT_ALLOWED_PROTOCOLS = ["http:", "https:"];

/**
 * Checks if a hostname or IP address resolves to a private, loopback, or cloud-metadata network.
 * Comprehensive protection against Server-Side Request Forgery (SSRF).
 */
export function isPrivateOrReservedHost(hostname) {
  if (!hostname || typeof hostname !== "string") return true;

  const cleanHost = hostname.trim().toLowerCase().replace(/^\[|\]$/g, "");

  // Known local/internal domain names
  if (
    cleanHost === "localhost" ||
    cleanHost.endsWith(".localhost") ||
    cleanHost.endsWith(".local") ||
    cleanHost.endsWith(".internal") ||
    cleanHost.endsWith(".lan") ||
    cleanHost === "metadata.google.internal"
  ) {
    return true;
  }

  // IPv6 checks
  if (
    cleanHost === "::1" ||
    cleanHost === "::" ||
    cleanHost.startsWith("fe80:") ||
    cleanHost.startsWith("fc00:") ||
    cleanHost.startsWith("fd00:") ||
    cleanHost.startsWith("::ffff:")
  ) {
    return true;
  }

  // Check numeric representations (decimal IP, hex IP)
  let ipCandidate = cleanHost;
  if (/^\d+$/.test(cleanHost)) {
    const num = parseInt(cleanHost, 10);
    if (num >= 0 && num <= 4294967295) {
      ipCandidate = [
        (num >>> 24) & 255,
        (num >>> 16) & 255,
        (num >>> 8) & 255,
        num & 255,
      ].join(".");
    }
  } else if (/^0x[0-9a-f]+$/i.test(cleanHost)) {
    const num = parseInt(cleanHost, 16);
    if (num >= 0 && num <= 4294967295) {
      ipCandidate = [
        (num >>> 24) & 255,
        (num >>> 16) & 255,
        (num >>> 8) & 255,
        num & 255,
      ].join(".");
    }
  }

  // IPv4 Octet checks
  const ipv4Match = ipCandidate.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, a, b, c, d] = ipv4Match.map(Number);
    if (a > 255 || b > 255 || c > 255 || d > 255) return true;

    // 0.0.0.0/8 (Broadcast/Current)
    if (a === 0) return true;
    // 10.0.0.0/8 (RFC 1918 Private)
    if (a === 10) return true;
    // 127.0.0.0/8 (Loopback)
    if (a === 127) return true;
    // 169.254.0.0/16 (Link-local & Cloud Metadata: 169.254.169.254)
    if (a === 169 && b === 254) return true;
    // 172.16.0.0/12 (RFC 1918 Private)
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.168.0.0/16 (RFC 1918 Private)
    if (a === 192 && b === 168) return true;
    // 100.64.0.0/10 (Carrier NAT)
    if (a === 100 && b >= 64 && b <= 127) return true;
    // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
    if (a >= 224) return true;
  }

  return false;
}

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
 */
export function validateUrl(urlStr, options = {}) {
  const {
    allowEmpty = true,
    allowedProtocols = DEFAULT_ALLOWED_PROTOCOLS,
    allowPrivate = true,
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

  // SSRF check if private addresses are explicitly forbidden
  if (!allowPrivate && isPrivateOrReservedHost(parsed.hostname)) {
    return {
      valid: false,
      error: "URL points to a restricted or private internal address (SSRF protection).",
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
