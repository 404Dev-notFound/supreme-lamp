const bcrypt = require("bcrypt");
const { prisma } = require("../lib/prisma");
const {
  createSessionRecord,
  validateSessionToken,
  revokeSessionToken,
  revokeAllUserSessions,
  sanitizeAuthUser,
  getCookieOptions,
} = require("../utils/sessionCookie");

// Timing-attack decoy hash for constant-time comparison on nonexistent accounts
const DUMMY_BCRYPT_HASH =
  "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
const BCRYPT_SALT_ROUNDS = 10;

class AuthError extends Error {
  constructor(message, statusCode = 400, code = "AUTH_ERROR") {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Register a new user with secure password hash and atomic profile creation.
 */
async function signup({ name, email, password, req = null }) {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedName = name.trim();

  // Check duplicate account
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (existingUser) {
    throw new AuthError(
      "An account with this email address already exists.",
      409,
      "ACCOUNT_EXISTS",
    );
  }

  // Securely hash password
  const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  // Extract client metadata
  const ipAddress =
    req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req?.socket?.remoteAddress ||
    "127.0.0.1";
  const userAgent = req?.headers?.["user-agent"] || "Web Client";

  // Create User, Profile, Preferences, and SecurityLog atomically
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
        eventType: "register_success",
        ipAddress,
        userAgent,
        details: { method: "credentials" },
      },
    });

    return user;
  });

  // Create active session in PostgreSQL
  const { sessionToken, csrfToken, cookieOptions } = await createSessionRecord(
    newUser.id,
    req,
  );

  return {
    user: sanitizeAuthUser(newUser),
    sessionToken,
    csrfToken,
    cookieOptions,
  };
}

/**
 * Sign in user with timing-attack resistant password verification.
 */
async function signin({ email, password, req = null }) {
  const normalizedEmail = email.trim().toLowerCase();

  const ipAddress =
    req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req?.socket?.remoteAddress ||
    "127.0.0.1";
  const userAgent = req?.headers?.["user-agent"] || "Web Client";

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { profile: true },
  });

  // Account does not exist or has no local password
  if (!user || !user.password) {
    // Constant-time decoy compare prevents user enumeration timing attacks
    await bcrypt.compare(String(password), DUMMY_BCRYPT_HASH);
    throw new AuthError(
      "Invalid email or password.",
      401,
      "INVALID_CREDENTIALS",
    );
  }

  // Verify password hash
  const isMatch = await bcrypt.compare(String(password), user.password);

  if (!isMatch) {
    // Log failed login attempt
    prisma.securityLog
      .create({
        data: {
          userId: user.id,
          eventType: "failed_login",
          ipAddress,
          userAgent,
        },
      })
      .catch(() => {});

    throw new AuthError(
      "Invalid email or password.",
      401,
      "INVALID_CREDENTIALS",
    );
  }

  // Verify account is active
  if (user.status !== "ACTIVE") {
    throw new AuthError(
      "Account is inactive or suspended.",
      403,
      "ACCOUNT_SUSPENDED",
    );
  }

  // Log successful login
  prisma.securityLog
    .create({
      data: {
        userId: user.id,
        eventType: "login_success",
        ipAddress,
        userAgent,
      },
    })
    .catch(() => {});

  // Create active session record in database
  const { sessionToken, csrfToken, cookieOptions } = await createSessionRecord(
    user.id,
    req,
  );

  return {
    user: sanitizeAuthUser(user),
    sessionToken,
    csrfToken,
    cookieOptions,
  };
}

/**
 * Verify session token and retrieve current user context.
 */
async function getSessionUser(sessionToken) {
  if (!sessionToken) {
    return { authenticated: false, user: null };
  }

  const validation = await validateSessionToken(sessionToken);

  if (!validation.valid || !validation.user) {
    return { authenticated: false, user: null };
  }

  return {
    authenticated: true,
    user: sanitizeAuthUser(validation.user),
    session: {
      id: validation.session.id,
      deviceType: validation.session.deviceType,
      browser: validation.session.browser,
      os: validation.session.os,
      lastActiveAt: validation.session.lastActiveAt,
    },
  };
}

/**
 * Invalidate a session token in database.
 */
async function logout(sessionToken) {
  if (sessionToken) {
    await revokeSessionToken(sessionToken);
  }
  return getCookieOptions();
}

/**
 * Invalidate all active sessions for a user (e.g. security breach, password change).
 */
async function logoutAll(userId, req = null) {
  if (!userId) return getCookieOptions();

  await revokeAllUserSessions(userId);

  const ipAddress =
    req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req?.socket?.remoteAddress ||
    "127.0.0.1";
  const userAgent = req?.headers?.["user-agent"] || "Web Client";

  prisma.securityLog
    .create({
      data: {
        userId,
        eventType: "logout_all_devices",
        ipAddress,
        userAgent,
      },
    })
    .catch(() => {});

  return getCookieOptions();
}

/**
 * Update user password with previous session invalidation.
 */
async function changePassword(
  userId,
  currentPassword,
  newPassword,
  req = null,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.password) {
    throw new AuthError("User not found.", 404, "USER_NOT_FOUND");
  }

  const isCurrentValid = await bcrypt.compare(
    String(currentPassword),
    user.password,
  );

  if (!isCurrentValid) {
    throw new AuthError(
      "Current password is incorrect.",
      400,
      "INVALID_CREDENTIALS",
    );
  }

  const newHash = await bcrypt.hash(String(newPassword), BCRYPT_SALT_ROUNDS);

  // Revoke all existing sessions to enforce security
  await revokeAllUserSessions(userId);

  const ipAddress =
    req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req?.socket?.remoteAddress ||
    "127.0.0.1";
  const userAgent = req?.headers?.["user-agent"] || "Web Client";

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { password: newHash },
    }),
    prisma.securityLog.create({
      data: {
        userId,
        eventType: "password_change",
        ipAddress,
        userAgent,
        details: { method: "user_account_settings" },
      },
    }),
  ]);

  // Issue a fresh active session
  const { sessionToken, csrfToken, cookieOptions } = await createSessionRecord(
    userId,
    req,
  );

  return {
    sessionToken,
    csrfToken,
    cookieOptions,
  };
}

module.exports = {
  signup,
  signin,
  getSessionUser,
  logout,
  logoutAll,
  changePassword,
  AuthError,
};
