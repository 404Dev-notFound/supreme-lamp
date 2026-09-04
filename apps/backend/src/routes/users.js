const { Router } = require("express");
const { prisma } = require("../db");
const { requireAuth } = require("../middleware/auth");
const {
  validateProfileUpdate,
  sanitizeSelfProfile,
  sanitizePublicProfile,
  maskIpAddress,
} = require("../utils/security");

const router = Router();

// GET /api/users/profile - Get authenticated user's full profile
router.get("/profile", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.sub;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized." });
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
      return res.status(404).json({ success: false, error: "User not found." });
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

// PUT /api/users/profile - Update authenticated user's profile with mass assignment & URL validation
router.put("/profile", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.sub;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized." });
    }

    const { isValid, errors, sanitized } = validateProfileUpdate(req.body);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: "Validation failed.",
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
    const userId = req.user.id || req.user.sub;

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

// DELETE /api/users/security/sessions/:sessionId - Revoke a specific session (IDOR Protected)
router.delete("/security/sessions/:sessionId", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.sub;
    const { sessionId } = req.params;

    const targetSession = await prisma.userSession.findUnique({
      where: { id: sessionId },
    });

    if (!targetSession) {
      return res.status(404).json({ success: false, error: "Session not found." });
    }

    // IDOR / BOLA Prevention: Verify ownership server-side
    if (targetSession.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Forbidden. You cannot revoke another user's session.",
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
});

// POST /api/users/security/sessions/revoke-all - Revoke all sessions for current user
router.post("/security/sessions/revoke-all", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.sub;

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
});

// GET /api/users/:id - Public profile with privacy check and field sanitization
router.get("/:id", async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

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
        error: "This profile is private.",
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
