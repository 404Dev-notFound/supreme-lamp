import crypto from "crypto";
import { prisma } from "./prisma";
import { parseUserAgent } from "./profileValidation";

export const SESSION_COOKIE_NAME = "flowctrl_session";
export const CSRF_COOKIE_NAME = "flowctrl_csrf";
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

/**
 * Returns security configuration for cookies based on environment
 */
export function getCookieOptions() {
  const isProd =
    process.env.NODE_ENV === "production" ||
    process.env.COOKIE_SECURE === "true";

  const sameSite = (process.env.COOKIE_SAME_SITE || "lax").toLowerCase();

  return {
    sessionCookie: {
      name: SESSION_COOKIE_NAME,
      httpOnly: true,
      secure: isProd,
      sameSite,
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
      domain: process.env.COOKIE_DOMAIN || undefined,
    },
    csrfCookie: {
      name: CSRF_COOKIE_NAME,
      httpOnly: false, // Must be readable by client JS to attach to custom header
      secure: isProd,
      sameSite,
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
      domain: process.env.COOKIE_DOMAIN || undefined,
    },
  };
}

/**
 * Generates a cryptographically strong random token
 */
export function generateSecureToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Creates an active UserSession in PostgreSQL and returns tokens & cookie options
 */
export async function createSessionRecord(userId, req) {
  const sessionToken = generateSecureToken(32);
  const csrfToken = generateSecureToken(16);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  // Extract client metadata safely
  let userAgent = "Web Browser";
  let ipAddress = "127.0.0.1";

  if (req) {
    if (typeof req.headers?.get === "function") {
      userAgent = req.headers.get("user-agent") || userAgent;
      ipAddress =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        ipAddress;
    } else if (req.headers) {
      userAgent = req.headers["user-agent"] || userAgent;
      ipAddress =
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.socket?.remoteAddress ||
        ipAddress;
    }
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

/**
 * Validates a session token from the HTTP-only cookie against PostgreSQL
 */
export async function validateSessionToken(token) {
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

  // Update last active time if more than 5 minutes since last update
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

/**
 * Revokes a specific session token
 */
export async function revokeSessionToken(token) {
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

/**
 * Revokes all sessions for a user
 */
export async function revokeAllUserSessions(userId) {
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

/**
 * Strips sensitive credentials from user object for safe frontend consumption
 */
export function sanitizeAuthUser(user) {
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

/**
 * Validates CSRF for state-changing requests
 */
export function validateCsrfHeader(req, csrfCookieValue) {
  if (!req) return false;

  let origin = null;
  let clientToken = null;

  if (typeof req.headers?.get === "function") {
    origin = req.headers.get("origin") || req.headers.get("referer");
    clientToken = req.headers.get("x-flowctrl-csrf");
  } else if (req.headers) {
    origin = req.headers["origin"] || req.headers["referer"];
    clientToken = req.headers["x-flowctrl-csrf"];
  }

  // Double-submit token check if cookie exists
  if (csrfCookieValue && clientToken) {
    if (csrfCookieValue === clientToken) return true;
  }

  // Origin check for same-origin browser requests
  if (origin) {
    const allowed = [
      "http://localhost:3000",
      "http://localhost:5000",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5000",
      process.env.NEXTAUTH_URL,
      process.env.APP_URL,
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    const isMatch = allowed.some((url) => {
      try {
        const expected = new URL(url).origin;
        return origin.startsWith(expected);
      } catch {
        return false;
      }
    });

    if (isMatch) return true;
  }

  return false;
}
