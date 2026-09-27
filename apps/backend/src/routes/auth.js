const { Router } = require("express");
const bcrypt = require("bcrypt");
const { prisma } = require("../db");
const { requireAuth } = require("../middleware/auth");
const { authRateLimiter } = require("../middleware/rateLimit");
const {
  SESSION_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  parseCookies,
  serializeCookie,
  createSessionRecord,
  validateSessionToken,
  revokeSessionToken,
  revokeAllUserSessions,
  sanitizeAuthUser,
  getCookieOptions,
} = require("../utils/sessionCookie");

const router = Router();

const DUMMY_BCRYPT_HASH =
  "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

// POST /api/auth/login
router.post("/login", authRateLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        code: "INVALID_CREDENTIALS",
        error: "Email and password are required.",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { profile: true },
    });

    if (!user || !user.password) {
      await bcrypt.compare(String(password), DUMMY_BCRYPT_HASH);
      return res.status(401).json({
        success: false,
        code: "INVALID_CREDENTIALS",
        error: "Invalid email or password.",
      });
    }

    const isMatch = await bcrypt.compare(String(password), user.password);

    if (!isMatch) {
      prisma.securityLog
        .create({
          data: {
            userId: user.id,
            eventType: "failed_login",
            ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
            userAgent: req.headers["user-agent"] || "Web Client",
          },
        })
        .catch(() => {});

      return res.status(401).json({
        success: false,
        code: "INVALID_CREDENTIALS",
        error: "Invalid email or password.",
      });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        code: "ACCOUNT_SUSPENDED",
        error: "Account is inactive or suspended.",
      });
    }

    // Create session in PostgreSQL
    const { sessionToken, csrfToken, cookieOptions } =
      await createSessionRecord(user.id, req);

    // Set HTTP-Only session cookie and CSRF cookie
    const sessionCookieStr = serializeCookie(
      cookieOptions.sessionCookie.name,
      sessionToken,
      cookieOptions.sessionCookie,
    );
    const csrfCookieStr = serializeCookie(
      cookieOptions.csrfCookie.name,
      csrfToken,
      cookieOptions.csrfCookie,
    );

    res.setHeader("Set-Cookie", [sessionCookieStr, csrfCookieStr]);
    res.setHeader("Cache-Control", "no-store, max-age=0");

    return res.status(200).json({
      success: true,
      authenticated: true,
      user: sanitizeAuthUser(user),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/signup
router.post("/signup", authRateLimiter, async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        error: "Name, email, and password are required.",
      });
    }

    const trimmedName = String(name).trim();
    const normalizedEmail = String(email).trim().toLowerCase();

    if (trimmedName.length < 2) {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        error: "Name must be at least 2 characters.",
      });
    }

    if (String(password).length < 8) {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        error: "Password must be at least 8 characters long.",
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        error: "Passwords do not match.",
      });
    }

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        code: "ACCOUNT_EXISTS",
        error: "An account with this email address already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: trimmedName,
          email: normalizedEmail,
          password: hashedPassword,
          role: "USER",
          status: "ACTIVE",
        },
      });

      await tx.userProfile.create({
        data: {
          userId: user.id,
          displayName: trimmedName,
          headline: "",
          bio: "",
          location: "",
        },
      });

      await tx.userPreference.create({
        data: {
          userId: user.id,
          theme: "dark",
          emailNotifications: true,
          profileVisibility: "PUBLIC",
        },
      });

      await tx.securityLog.create({
        data: {
          userId: user.id,
          eventType: "user_registered",
          ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
          userAgent: req.headers["user-agent"] || "Web Client",
          details: { method: "credentials" },
        },
      });

      return user;
    });

    const { sessionToken, csrfToken, cookieOptions } =
      await createSessionRecord(newUser.id, req);

    const sessionCookieStr = serializeCookie(
      cookieOptions.sessionCookie.name,
      sessionToken,
      cookieOptions.sessionCookie,
    );
    const csrfCookieStr = serializeCookie(
      cookieOptions.csrfCookie.name,
      csrfToken,
      cookieOptions.csrfCookie,
    );

    res.setHeader("Set-Cookie", [sessionCookieStr, csrfCookieStr]);
    res.setHeader("Cache-Control", "no-store, max-age=0");

    return res.status(201).json({
      success: true,
      authenticated: true,
      message: "Account created successfully.",
      user: sanitizeAuthUser(newUser),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get("/me", async (req, res, next) => {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const sessionToken = cookies[SESSION_COOKIE_NAME];

    if (sessionToken) {
      const validation = await validateSessionToken(sessionToken);
      if (validation.valid && validation.user) {
        res.setHeader("Cache-Control", "no-store, max-age=0");
        return res.status(200).json({
          authenticated: true,
          user: sanitizeAuthUser(validation.user),
          session: {
            id: validation.session.id,
            deviceType: validation.session.deviceType,
            browser: validation.session.browser,
            os: validation.session.os,
            lastActiveAt: validation.session.lastActiveAt,
          },
        });
      }
    }

    res.setHeader("Cache-Control", "no-store, max-age=0");
    return res.status(200).json({
      authenticated: false,
      user: null,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout
router.post("/logout", async (req, res, next) => {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const sessionToken = cookies[SESSION_COOKIE_NAME];

    if (sessionToken) {
      await revokeSessionToken(sessionToken);
    }

    const { sessionCookie: sessOpts, csrfCookie: csrfOpts } = getCookieOptions();

    const expiredSessionCookie = serializeCookie(SESSION_COOKIE_NAME, "", {
      ...sessOpts,
      maxAge: 0,
      expires: new Date(0),
    });
    const expiredCsrfCookie = serializeCookie(CSRF_COOKIE_NAME, "", {
      ...csrfOpts,
      maxAge: 0,
      expires: new Date(0),
    });

    res.setHeader("Set-Cookie", [expiredSessionCookie, expiredCsrfCookie]);
    res.setHeader("Cache-Control", "no-store, max-age=0");

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout-all
router.post("/logout-all", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;

    await revokeAllUserSessions(userId);

    prisma.securityLog
      .create({
        data: {
          userId,
          eventType: "logout_all_devices",
          ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
          userAgent: req.headers["user-agent"] || "Web Client",
        },
      })
      .catch(() => {});

    const { sessionCookie: sessOpts, csrfCookie: csrfOpts } = getCookieOptions();

    const expiredSessionCookie = serializeCookie(SESSION_COOKIE_NAME, "", {
      ...sessOpts,
      maxAge: 0,
      expires: new Date(0),
    });
    const expiredCsrfCookie = serializeCookie(CSRF_COOKIE_NAME, "", {
      ...csrfOpts,
      maxAge: 0,
      expires: new Date(0),
    });

    res.setHeader("Set-Cookie", [expiredSessionCookie, expiredCsrfCookie]);
    res.setHeader("Cache-Control", "no-store, max-age=0");

    return res.status(200).json({
      success: true,
      message: "Successfully signed out from all devices.",
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/change-password
router.post("/change-password", requireAuth, authRateLimiter, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        error: "Current password and new password are required.",
      });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        error: "New password must be at least 8 characters long.",
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        error: "New passwords do not match.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.password) {
      return res.status(404).json({
        success: false,
        code: "INVALID_USER",
        error: "User not found.",
      });
    }

    const isCurrentValid = await bcrypt.compare(
      String(currentPassword),
      user.password,
    );

    if (!isCurrentValid) {
      return res.status(400).json({
        success: false,
        code: "INVALID_CREDENTIALS",
        error: "Current password is incorrect.",
      });
    }

    const newHash = await bcrypt.hash(String(newPassword), 10);

    // Revoke previous sessions and update password
    await revokeAllUserSessions(userId);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { password: newHash },
      }),
      prisma.securityLog.create({
        data: {
          userId,
          eventType: "password_change",
          ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
          userAgent: req.headers["user-agent"] || "Web Client",
          details: { method: "user_account_settings" },
        },
      }),
    ]);

    // Issue a fresh session
    const { sessionToken, csrfToken, cookieOptions } =
      await createSessionRecord(userId, req);

    const sessionCookieStr = serializeCookie(
      cookieOptions.sessionCookie.name,
      sessionToken,
      cookieOptions.sessionCookie,
    );
    const csrfCookieStr = serializeCookie(
      cookieOptions.csrfCookie.name,
      csrfToken,
      cookieOptions.csrfCookie,
    );

    res.setHeader("Set-Cookie", [sessionCookieStr, csrfCookieStr]);
    res.setHeader("Cache-Control", "no-store, max-age=0");

    return res.status(200).json({
      success: true,
      message: "Password changed successfully. Active sessions have been refreshed.",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = { authRouter: router };
