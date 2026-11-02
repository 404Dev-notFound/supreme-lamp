const { getUserMembership } = require("../services/membership.service");
const { parseCookies, validateSessionToken, SESSION_COOKIE_NAME } = require("../utils/sessionCookie");
const jwt = require("jsonwebtoken");
const config = require("../config");
const { prisma } = require("../lib/prisma");

/**
 * Helper to resolve user from request without failing if unauthenticated.
 */
async function resolveUserFromReq(req) {
  if (req.user) {
    return req.user;
  }

  // 1. Session Cookie
  const cookies = parseCookies(req.headers?.cookie);
  const sessionToken = cookies[SESSION_COOKIE_NAME];
  if (sessionToken) {
    const validation = await validateSessionToken(sessionToken);
    if (validation.valid && validation.user) {
      req.user = {
        id: validation.user.id,
        email: validation.user.email,
        role: validation.user.role,
        name: validation.user.name,
      };
      req.session = validation.session;
      return req.user;
    }
  }

  // 2. Bearer Header
  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, config.jwt.secret, {
        algorithms: ["HS256"],
      });
      const userId = decoded.id || decoded.sub || decoded.userId;
      if (userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true, role: true, name: true, status: true },
        });
        if (user && user.status === "ACTIVE") {
          req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
          };
          return req.user;
        }
      }
    } catch {
      // Ignore token decode failures in soft-resolution
    }
  }

  return null;
}

/**
 * Middleware: Soft-attaches membership info to req.isPremium and req.membership.
 * Never halts the request chain.
 */
const attachMembership = async (req, res, next) => {
  try {
    const user = await resolveUserFromReq(req);
    if (user && user.id) {
      const membershipData = await getUserMembership(user.id);
      req.membership = membershipData;
      req.isPremium = Boolean(membershipData.isPremium);
    } else {
      req.membership = null;
      req.isPremium = false;
    }
  } catch (err) {
    req.membership = null;
    req.isPremium = false;
  }
  next();
};

/**
 * Middleware: Hard requirement for active Premium membership.
 * Rejects unauthenticated requests with 401, non-premium with 403.
 */
const requirePremium = async (req, res, next) => {
  try {
    const user = await resolveUserFromReq(req);

    if (!user) {
      return res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        error: "Authentication required. Please sign in to access premium resources.",
      });
    }

    const membershipData = await getUserMembership(user.id);
    req.membership = membershipData;
    req.isPremium = Boolean(membershipData.isPremium);

    if (!req.isPremium) {
      return res.status(403).json({
        success: false,
        code: "PREMIUM_REQUIRED",
        error: "Available with Premium Membership. Unlock exclusive learning resources and access premium roadmaps with flowCTRL Premium.",
        isLocked: true,
      });
    }

    next();
  } catch (error) {
    console.error("requirePremium middleware error:", error);
    return res.status(500).json({
      success: false,
      code: "MEMBERSHIP_VERIFICATION_ERROR",
      error: "An internal error occurred during membership verification.",
    });
  }
};

module.exports = {
  attachMembership,
  requirePremium,
};

