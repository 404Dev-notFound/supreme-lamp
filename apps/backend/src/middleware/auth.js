const { getToken } = require("next-auth/jwt");
const { prisma } = require("../db");
const {
  parseCookies,
  validateSessionToken,
  SESSION_COOKIE_NAME,
} = require("../utils/sessionCookie");

const secret = process.env.NEXTAUTH_SECRET;

/**
 * Centralized Cookie-Based Authentication Middleware
 * --------------------------------------------------
 * 1. Reads HTTP-only cookie `flowctrl_session`.
 * 2. Validates session token against PostgreSQL `UserSession` table.
 * 3. Falls back gracefully to NextAuth session token cookie.
 * 4. Attaches verified `req.user = { id, email, role, name }`.
 * 5. Rejects any attempt to forge identity via client request body.
 */
const requireAuth = async (req, res, next) => {
  try {
    // 1. Primary path: HTTP-Only cookie `flowctrl_session`
    const cookies = parseCookies(req.headers.cookie);
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
        return next();
      }
    }

    // 2. NextAuth compatibility fallback
    let token = await getToken({ req, secret });

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      const rawToken = req.headers.authorization.split(" ")[1];
      try {
        const jwt = require("jsonwebtoken");
        token = jwt.verify(rawToken, secret);
      } catch {}
    }

    if (token && (token.id || token.sub)) {
      const userId = token.id || token.sub;
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (user && user.status === "ACTIVE") {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
        };
        return next();
      }
    }

    // Unauthenticated
    return res.status(401).json({
      success: false,
      code: "AUTH_REQUIRED",
      error: "Unauthorized. Authentication cookie missing or session expired.",
    });
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      code: "AUTH_INTERNAL_ERROR",
      error: "Internal server error during authentication.",
    });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user || !user.role || !roles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        code: "FORBIDDEN",
        error: "Forbidden. Insufficient permissions.",
      });
    }

    next();
  };
};

module.exports = {
  requireAuth,
  requireRole,
};
