const { Router } = require("express");
const { prisma } = require("../db");
const { requireAuth } = require("../middleware/auth.middleware");
const { userMutationRateLimiter } = require("../middleware/rateLimit.middleware");
const {
  validateProfileUpdate,
  sanitizeSelfProfile,
  sanitizePublicProfile,
  maskIpAddress,
} = require("../utils/security");

const router = Router();
const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;

// GET /api/users/profile - Get authenticated user's full profile
router.get("/profile", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        error: "Authentication required.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        preferences: true,
        userSkills: {
          include: {
            skill: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        code: "USER_NOT_FOUND",
        error: "User profile not found.",
      });
    }

    res.setHeader("Cache-Control", "no-store, max-age=0");
    return res.status(200).json({
      success: true,
      data: sanitizeSelfProfile(user),
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/profile - Update authenticated user's profile with mass assignment & SSRF validation
router.put("/profile", requireAuth, userMutationRateLimiter, async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        error: "Authentication required.",
      });
    }

    const { isValid, errors, sanitized } = validateProfileUpdate(req.body);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        error: errors[0] || "Profile validation failed.",
        details: errors,
      });
    }

    const {
      name,
      displayName,
      firstName,
      lastName,
      headline,
      bio,
      avatarUrl,
      location,
      websiteUrl,
      githubUrl,
      linkedinUrl,
      twitterUrl,
      skills,
    } = sanitized;

    const updatedUser = await prisma.$transaction(async (tx) => {
      if (name !== undefined) {
        await tx.user.update({
          where: { id: userId },
          data: { name },
        });
      }

      await tx.userProfile.upsert({
        where: { userId },
        create: {
          userId,
          displayName: displayName || name || null,
          firstName: firstName || null,
          lastName: lastName || null,
          headline: headline || null,
          bio: bio || null,
          avatarUrl: avatarUrl || null,
          location: location || null,
          websiteUrl: websiteUrl || null,
          githubUrl: githubUrl || null,
          linkedinUrl: linkedinUrl || null,
          twitterUrl: twitterUrl || null,
        },
        update: {
          ...(displayName !== undefined && { displayName }),
          ...(firstName !== undefined && { firstName }),
          ...(lastName !== undefined && { lastName }),
          ...(headline !== undefined && { headline }),
          ...(bio !== undefined && { bio }),
          ...(avatarUrl !== undefined && { avatarUrl }),
          ...(location !== undefined && { location }),
          ...(websiteUrl !== undefined && { websiteUrl }),
          ...(githubUrl !== undefined && { githubUrl }),
          ...(linkedinUrl !== undefined && { linkedinUrl }),
          ...(twitterUrl !== undefined && { twitterUrl }),
        },
      });

      if (Array.isArray(skills)) {
        await tx.userSkill.deleteMany({
          where: { userId },
        });

        for (const skillName of skills) {
          const trimmedSkill = skillName.trim();
          if (!trimmedSkill) continue;

          const skillRecord = await tx.skill.upsert({
            where: { name: trimmedSkill },
            create: {
              name: trimmedSkill,
              category: "General",
            },
            update: {},
          });

          await tx.userSkill.create({
            data: {
              userId,
              skillId: skillRecord.id,
              proficiency: 3,
            },
          });
        }
      }

      return tx.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          preferences: true,
          skills: {
            include: {
              skill: true,
            },
          },
        },
      });
    });

    res.setHeader("Cache-Control", "no-store, max-age=0");
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: sanitizeSelfProfile(updatedUser),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/security/sessions - List active sessions for authenticated user
router.get("/security/sessions", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const sessions = await prisma.userSession.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActiveAt: "desc" },
    });

    const sanitizedSessions = sessions.map((s) => ({
      id: s.id,
      deviceType: s.deviceType || "Desktop",
      browser: s.browser || "Browser",
      os: s.os || "OS",
      maskedIp: maskIpAddress(s.ipAddress),
      lastActiveAt: s.lastActiveAt,
      createdAt: s.createdAt,
    }));

    res.setHeader("Cache-Control", "no-store, max-age=0");
    return res.status(200).json({
      success: true,
      data: sanitizedSessions,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/users/security/sessions/:sessionId - Revoke a specific session (Strict IDOR Protected)
router.delete(
  "/security/sessions/:sessionId",
  requireAuth,
  userMutationRateLimiter,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { sessionId } = req.params;

      if (!sessionId || !SAFE_ID_REGEX.test(sessionId)) {
        return res.status(400).json({
          success: false,
          code: "INVALID_IDENTIFIER",
          error: "Valid session identifier is required.",
        });
      }

      const targetSession = await prisma.userSession.findUnique({
        where: { id: sessionId },
      });

      if (!targetSession) {
        return res.status(404).json({
          success: false,
          code: "SESSION_NOT_FOUND",
          error: "Session not found.",
        });
      }

      // IDOR / BOLA Prevention: Verify ownership server-side
      if (targetSession.userId !== userId) {
        return res.status(403).json({
          success: false,
          code: "FORBIDDEN",
          error: "Access denied. You cannot modify or revoke another user's session.",
        });
      }

      await prisma.userSession.delete({
        where: { id: sessionId },
      });

      return res.status(200).json({
        success: true,
        message: "Session revoked successfully.",
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/users/security/sessions/revoke-all - Revoke all sessions for current user
router.post(
  "/security/sessions/revoke-all",
  requireAuth,
  userMutationRateLimiter,
  async (req, res, next) => {
    try {
      const userId = req.user.id;

      const result = await prisma.userSession.deleteMany({
        where: { userId },
      });

      return res.status(200).json({
        success: true,
        message: `All ${result.count} active sessions revoked successfully.`,
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /api/users/:id - Public profile with privacy check and field sanitization
router.get("/:id", async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    if (!targetUserId || !SAFE_ID_REGEX.test(targetUserId)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_IDENTIFIER",
        error: "Valid user identifier format required.",
      });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        profile: true,
        preferences: true,
        userSkills: {
          include: {
            skill: true,
          },
        },
      },
    });

    if (!targetUser || targetUser.status !== "ACTIVE") {
      return res.status(404).json({
        success: false,
        code: "USER_NOT_FOUND",
        error: "User profile not found or inactive.",
      });
    }

    // Check visibility preference
    const isPublic =
      !targetUser.preferences ||
      targetUser.preferences.profileVisibility === "PUBLIC";

    if (!isPublic) {
      return res.status(403).json({
        success: false,
        code: "PROFILE_PRIVATE",
        error: "This profile has been marked as private by the user.",
      });
    }

    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=120");
    return res.status(200).json({
      success: true,
      data: sanitizePublicProfile(targetUser),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = { usersRouter: router };
