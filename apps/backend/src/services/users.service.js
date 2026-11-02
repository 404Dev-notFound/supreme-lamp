const path = require("path");
const { prisma } = require("../lib/prisma");
const storageService = require("./storage.service");
const {
  sanitizeSelfProfile,
  sanitizePublicProfile,
  maskIpAddress,
} = require("../utils/security");

class UsersService {
  async getUserProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        preferences: true,
        membership: {
          include: {
            plan: true,
          },
        },
        userSkills: {
          include: {
            skill: true,
          },
        },
      },
    });

    if (!user) {
      const err = new Error("User profile not found.");
      err.statusCode = 404;
      err.code = "USER_NOT_FOUND";
      throw err;
    }

    return sanitizeSelfProfile(user);
  }

  async updateUserProfile(userId, sanitized) {
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

    return sanitizeSelfProfile(updatedUser);
  }

  async listUserSessions(userId) {
    const sessions = await prisma.userSession.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActiveAt: "desc" },
    });

    return sessions.map((s) => ({
      id: s.id,
      deviceType: s.deviceType || "Desktop",
      browser: s.browser || "Browser",
      os: s.os || "OS",
      maskedIp: maskIpAddress(s.ipAddress),
      lastActiveAt: s.lastActiveAt,
      createdAt: s.createdAt,
    }));
  }

  async revokeUserSession(userId, sessionId) {
    const targetSession = await prisma.userSession.findUnique({
      where: { id: sessionId },
    });

    if (!targetSession) {
      const err = new Error("Session not found.");
      err.statusCode = 404;
      err.code = "SESSION_NOT_FOUND";
      throw err;
    }

    // IDOR / BOLA Prevention: Verify ownership server-side
    if (targetSession.userId !== userId) {
      const err = new Error(
        "Access denied. You cannot modify or revoke another user's session.",
      );
      err.statusCode = 403;
      err.code = "FORBIDDEN";
      throw err;
    }

    await prisma.userSession.delete({
      where: { id: sessionId },
    });

    return {
      success: true,
      message: "Session revoked successfully.",
    };
  }

  async revokeAllUserSessions(userId) {
    const result = await prisma.userSession.deleteMany({
      where: { userId },
    });

    return {
      success: true,
      message: `All ${result.count} active sessions revoked successfully.`,
    };
  }

  async getPublicProfile(targetUserId) {
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        profile: true,
        preferences: true,
        membership: {
          include: {
            plan: true,
          },
        },
        userSkills: {
          include: {
            skill: true,
          },
        },
      },
    });

    if (!targetUser || targetUser.status !== "ACTIVE") {
      const err = new Error("User profile not found or inactive.");
      err.statusCode = 404;
      err.code = "USER_NOT_FOUND";
      throw err;
    }

    const isPublic =
      !targetUser.preferences ||
      targetUser.preferences.profileVisibility === "PUBLIC";

    if (!isPublic) {
      const err = new Error("This profile has been marked as private by the user.");
      err.statusCode = 403;
      err.code = "PROFILE_PRIVATE";
      throw err;
    }

    return sanitizePublicProfile(targetUser);
  }

  async uploadAvatar(userId, file) {
    const stored = await storageService.storeFile({
      buffer: file.buffer,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      category: "avatar",
    });

    const avatarEndpointUrl = `/api/users/avatar/${path.basename(stored.storageKey)}`;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { image: avatarEndpointUrl },
      }),
      prisma.userProfile.upsert({
        where: { userId },
        create: { userId, avatarUrl: avatarEndpointUrl },
        update: { avatarUrl: avatarEndpointUrl },
      }),
    ]);

    return {
      avatarUrl: avatarEndpointUrl,
    };
  }

  getAvatarFile(avatarId) {
    const storageKey = `avatar/${avatarId}`;
    if (!storageService.fileExists(storageKey)) {
      const err = new Error("Avatar not found.");
      err.statusCode = 404;
      err.code = "AVATAR_NOT_FOUND";
      throw err;
    }

    const ext = path.extname(avatarId).toLowerCase();
    const mimeMap = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".webp": "image/webp",
    };

    return {
      mimeType: mimeMap[ext] || "application/octet-stream",
      stream: storageService.getReadStream(storageKey),
    };
  }
}

module.exports = new UsersService();

