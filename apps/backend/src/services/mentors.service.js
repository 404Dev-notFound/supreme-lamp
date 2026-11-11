const { prisma } = require("../lib/prisma");
const { recordAuditLog } = require("./audit.service");

class MentorError extends Error {
  constructor(message, statusCode = 400, code = "MENTOR_ERROR") {
    super(message);
    this.name = "MentorError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * List mentors with pagination and filters
 */
async function listMentors({
  page = 1,
  limit = 20,
  search = "",
  minExp = null,
  maxRate = null,
  isAvailable = null,
} = {}) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (safePage - 1) * safeLimit;

  const where = {
    user: { status: "ACTIVE" },
  };

  if (isAvailable !== null) {
    where.isAvailable = Boolean(isAvailable);
  }

  if (minExp !== null && !isNaN(minExp)) {
    where.yearsOfExp = { gte: parseInt(minExp, 10) };
  }

  if (maxRate !== null && !isNaN(maxRate)) {
    where.hourlyRate = { lte: parseFloat(maxRate) };
  }

  if (search && typeof search === "string" && search.trim()) {
    const q = search.trim().slice(0, 100);
    where.OR = [
      { expertise: { contains: q, mode: "insensitive" } },
      { user: { name: { contains: q, mode: "insensitive" } } },
      { user: { profile: { headline: { contains: q, mode: "insensitive" } } } },
    ];
  }

  const [total, mentors] = await prisma.$transaction([
    prisma.mentorProfile.count({ where }),
    prisma.mentorProfile.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: [{ isAvailable: "desc" }, { createdAt: "desc" }],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
            profile: {
              select: {
                displayName: true,
                headline: true,
                bio: true,
                avatarUrl: true,
                location: true,
                linkedinUrl: true,
                githubUrl: true,
              },
            },
            userSkills: {
              include: {
                skill: { select: { name: true, category: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  const formattedMentors = mentors.map((m) => ({
    ...m,
    hourlyRate: m.hourlyRate !== null && m.hourlyRate !== undefined ? Number(m.hourlyRate) : null,
  }));

  return {
    mentors: formattedMentors,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}

/**
 * Get mentor profile by ID or userId
 */
async function getMentorById(id) {
  const mentor = await prisma.mentorProfile.findFirst({
    where: {
      OR: [{ id }, { userId: id }],
      user: { status: "ACTIVE" },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          role: true,
          profile: true,
          userSkills: {
            include: { skill: true },
          },
        },
      },
    },
  });

  if (!mentor) {
    throw new MentorError("Mentor profile not found.", 404, "MENTOR_NOT_FOUND");
  }

  return {
    ...mentor,
    hourlyRate: mentor.hourlyRate !== null && mentor.hourlyRate !== undefined ? Number(mentor.hourlyRate) : null,
  };
}

/**
 * Apply / create or update mentor profile for authenticated user
 */
async function upsertMentorProfile({ userId, data, req = null }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.status !== "ACTIVE") {
    throw new MentorError("User not found or inactive.", 404, "USER_NOT_FOUND");
  }

  const profile = await prisma.$transaction(async (tx) => {
    const upserted = await tx.mentorProfile.upsert({
      where: { userId },
      create: {
        userId,
        expertise: data.expertise,
        yearsOfExp: data.yearsOfExp,
        hourlyRate: data.hourlyRate,
        isAvailable: data.isAvailable,
      },
      update: {
        expertise: data.expertise,
        yearsOfExp: data.yearsOfExp,
        hourlyRate: data.hourlyRate,
        isAvailable: data.isAvailable,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profile: true,
          },
        },
      },
    });

    if (upserted && upserted.hourlyRate !== null && upserted.hourlyRate !== undefined) {
      upserted.hourlyRate = Number(upserted.hourlyRate);
    }

    return upserted;
  });

  await recordAuditLog({
    userId,
    action: "MENTOR_PROFILE_UPDATED",
    targetType: "MentorProfile",
    targetId: profile.id,
    req,
  });

  return profile;
}

/**
 * Delete mentor profile
 */
async function deleteMentorProfile({ id, userId, userRole, req = null }) {
  const mentor = await prisma.mentorProfile.findUnique({ where: { id } });
  if (!mentor) {
    throw new MentorError("Mentor profile not found.", 404, "MENTOR_NOT_FOUND");
  }

  const isOwner = mentor.userId === userId;
  const isAdmin = userRole === "ADMIN";

  if (!isOwner && !isAdmin) {
    throw new MentorError("Access denied.", 403, "FORBIDDEN");
  }

  await prisma.mentorProfile.delete({ where: { id } });

  await recordAuditLog({
    userId,
    action: "MENTOR_PROFILE_DELETED",
    targetType: "MentorProfile",
    targetId: id,
    req,
  });

  return { message: "Mentor profile removed successfully." };
}

module.exports = {
  listMentors,
  getMentorById,
  upsertMentorProfile,
  deleteMentorProfile,
  MentorError,
};
