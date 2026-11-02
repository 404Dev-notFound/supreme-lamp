const { prisma } = require("../lib/prisma");

/**
 * Audit Logging Service
 * Records sensitive administrative, security, and data modification events.
 * Never logs credentials, passwords, or raw secrets.
 */

async function recordAuditLog({
  userId = null,
  action,
  targetType,
  targetId = null,
  ipAddress = null,
  userAgent = null,
  details = null,
  req = null,
}) {
  try {
    const finalIp =
      ipAddress ||
      req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req?.socket?.remoteAddress ||
      "127.0.0.1";

    const finalUa = userAgent || req?.headers?.["user-agent"] || "System";
    const finalUserId = userId || req?.user?.id || null;

    // Sanitize details to ensure no secrets or password fields leak
    let sanitizedDetails = details;
    if (details && typeof details === "object") {
      sanitizedDetails = { ...details };
      const SENSITIVE_KEYS = [
        "password",
        "passwordHash",
        "token",
        "sessionToken",
        "secret",
        "apiKey",
      ];
      for (const k of SENSITIVE_KEYS) {
        if (k in sanitizedDetails) {
          delete sanitizedDetails[k];
        }
      }
    }

    return await prisma.auditLog.create({
      data: {
        userId: finalUserId,
        action,
        targetType,
        targetId: targetId ? String(targetId) : null,
        ipAddress: finalIp ? String(finalIp).slice(0, 45) : null,
        userAgent: finalUa ? String(finalUa).slice(0, 255) : null,
        details: sanitizedDetails || {},
      },
    });
  } catch (err) {
    // Audit failures should not crash user-facing requests, but must be logged
    console.error("[AuditService] Failed to record audit log:", err.message);
    return null;
  }
}

module.exports = {
  recordAuditLog,
};
