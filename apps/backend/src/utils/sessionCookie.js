const crypto = require("crypto");
const { prisma } = require("../db");

const SESSION_COOKIE_NAME = "flowctrl_session";
const CSRF_COOKIE_NAME = "flowctrl_csrf";
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader || typeof cookieHeader !== "string") return cookies;
  const pairs = cookieHeader.split(";");
  for (const pair of pairs) {
    const idx = pair.indexOf("=");
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    if (key) {
      try {
        cookies[key] = decodeURIComponent(val);
      } catch {
        cookies[key] = val;
      }
    }
  }
  return cookies;
}

function serializeCookie(name, val, options = {}) {
  const enc = encodeURIComponent;
  let str = `${name}=${enc(val)}`;
  if (options.maxAge != null) {
    str += `; Max-Age=${Math.floor(options.maxAge)}`;
  }
  if (options.domain) {
    str += `; Domain=${options.domain}`;
  }
  str += options.path ? `; Path=${options.path}` : `; Path=/`;
  if (options.expires) {
    str += `; Expires=${options.expires.toUTCString()}`;
  }
  if (options.httpOnly) {
    str += `; HttpOnly`;
  }
  if (options.secure) {
    str += `; Secure`;
  }
  if (options.sameSite) {
    const s = String(options.sameSite).toLowerCase();
    if (s === "strict") {
      str += `; SameSite=Strict`;
    } else if (s === "none") {
      str += `; SameSite=None`;
    } else {
      str += `; SameSite=Lax`;
    }
  }
  return str;
}

function getCookieOptions() {
  const isProd =
    process.env.NODE_ENV === "production" ||
    process.env.COOKIE_SECURE === "true";

  const sameSite = (process.env.COOKIE_SAME_SITE || "lax").toLowerCase();

  return {
    sessionCookie: {
      httpOnly: true,
      secure: isProd,
      sameSite,
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
      domain: process.env.COOKIE_DOMAIN || undefined,
    },
    csrfCookie: {
      httpOnly: false, // Accessible by client script for header attachment
      secure: isProd,
      sameSite,
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
      domain: process.env.COOKIE_DOMAIN || undefined,
    },
  };
}

function generateSecureToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

function parseUserAgent(ua) {
  if (!ua || typeof ua !== "string") {
    return { deviceType: "Desktop", browser: "Unknown", os: "Unknown" };
  }

  let deviceType = "Desktop";
  if (/mobile|android|iphone|ipod/i.test(ua)) deviceType = "Mobile";
  else if (/ipad|tablet/i.test(ua)) deviceType = "Tablet";

  let browser = "Unknown";
  if (/edg/i.test(ua)) browser = "Edge";
  else if (/chrome|crios/i.test(ua)) browser = "Chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua)) browser = "Safari";

  let os = "Unknown";
  if (/windows/i.test(ua)) os = "Windows";
  else if (/macintosh|mac os x/i.test(ua)) os = "macOS";
  else if (/linux/i.test(ua)) os = "Linux";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";

  return { deviceType, browser, os };
}

async function createSessionRecord(userId, req) {
  const sessionToken = generateSecureToken(32);
  const csrfToken = generateSecureToken(16);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  let userAgent = "Web Browser";
  let ipAddress = "127.0.0.1";

  if (req) {
    userAgent = req.headers?.["user-agent"] || userAgent;
    ipAddress =
      req.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      ipAddress;
  }

  const { deviceType, browser, os } = parseUserAgent(userAgent);

  const session = await prisma.userSession.create({
    data: {
      userId,
      sessionToken,
      ipAddress,
      userAgent: userAgent.slice(0, 500),
      deviceType,
      browser,
      os,
      expiresAt,
    },
  });

  const cookieOptions = getCookieOptions();

  return {
    session,
    sessionToken,
    csrfToken,
    cookieOptions,
  };
}

async function validateSessionToken(token) {
  if (!token || typeof token !== "string" || token.length < 16) {
    return { valid: false, reason: "INVALID_TOKEN_FORMAT" };
  }

  const session = await prisma.userSession.findUnique({
    where: { sessionToken: token },
    include: {
      user: {
        include: {
          profile: true,
        },
      },
    },
  });

  if (!session) {
    return { valid: false, reason: "SESSION_NOT_FOUND" };
  }

  if (session.revokedAt) {
    return { valid: false, reason: "SESSION_REVOKED" };
  }

  if (session.expiresAt < new Date()) {
    return { valid: false, reason: "SESSION_EXPIRED" };
  }

  if (session.user.status !== "ACTIVE") {
    return { valid: false, reason: "ACCOUNT_INACTIVE" };
  }

  // Update last active if > 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  if (session.lastActiveAt < fiveMinutesAgo) {
    prisma.userSession
      .update({
        where: { id: session.id },
        data: { lastActiveAt: new Date() },
      })
      .catch(() => {});
  }

  return {
    valid: true,
    session,
    user: session.user,
  };
}

async function revokeSessionToken(token) {
  if (!token) return false;
  try {
    await prisma.userSession.update({
      where: { sessionToken: token },
      data: { revokedAt: new Date() },
    });
    return true;
  } catch {
    return false;
  }
}

async function revokeAllUserSessions(userId) {
  if (!userId) return false;
  try {
    await prisma.userSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return true;
  } catch {
    return false;
  }
}

function sanitizeAuthUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.profile?.displayName || user.name || "FlowCTRL User",
    email: user.email,
    role: user.role || "USER",
    status: user.status || "ACTIVE",
    image: user.profile?.avatarUrl || user.image || null,
    createdAt: user.createdAt,
  };
}

module.exports = {
  SESSION_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  parseCookies,
  serializeCookie,
  getCookieOptions,
  generateSecureToken,
  createSessionRecord,
  validateSessionToken,
  revokeSessionToken,
  revokeAllUserSessions,
  sanitizeAuthUser,
};
