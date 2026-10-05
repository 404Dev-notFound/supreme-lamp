const jwt = require("jsonwebtoken");
const { prisma } = require("../lib/prisma");
const config = require("../config");
const {
  parseCookies,
  validateSessionToken,
  SESSION_COOKIE_NAME,
} = require("../utils/sessionCookie");

/**
 * Production Authentication Middleware
 * -------------------------------------
 * 1. Extracts credentials strictly from verified sources:
 *    - Primary: HTTP-Only cookie `flowctrl_session` (CSRF-immune session token)
 *    - Secondary: Authorization: Bearer <jwt> (for programmatic API clients)
 * 2. Validates session status against PostgreSQL `UserSession` table.
 * 3. Enforces that the session is not expired and not revoked.
 * 4. Resolves authenticated user identity directly from verified server state.
 * 5. Attaches `req.user = { id, email, role, name }` and `req.session`.
 * 6. Hard-fails any attempt to inject identity via body, params, or query.
 */

const requireAuth = async (req, res, next) => {
  try {
    // 1. Primary path: HTTP-Only session cookie
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

    // 2. Secondary path: Bearer JWT token header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = jwt.verify(token, config.jwt.secret);
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
            return next();
          }
        }
      } catch (jwtErr) {
        // Token verification failed or expired - fall through to 401
      }
    }

    // 3. Unauthenticated rejection
    return res.status(401).json({
      success: false,
      code: "UNAUTHORIZED",
      error: "Authentication required. Please sign in to access this resource.",
    });
  } catch (error) {
    console.error("Auth middleware internal error:", error);
    return res.status(500).json({
      success: false,
      code: "AUTH_INTERNAL_ERROR",
      error: "An internal error occurred during authentication verification.",
    });
  }
};

/**
 * Role-Based Access Control (RBAC) Middleware
 * Verifies that the authenticated user possesses one of the allowed roles.
 */
const requireRole = (allowedRoles = []) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        error: "Authentication required.",
      });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        code: "FORBIDDEN",
        error: "Access denied. Insufficient permissions for this action.",
      });
    }

    next();
  };
};

module.exports = {
  requireAuth,
  requireRole,
};
