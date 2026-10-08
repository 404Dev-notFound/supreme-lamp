const { prisma } = require("../lib/prisma");

class RoadmapProgressError extends Error {
  constructor(message, statusCode = 400, code = "ROADMAP_PROGRESS_ERROR") {
    super(message);
    this.name = "RoadmapProgressError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Get progress for a specific roadmap
 */
async function getRoadmapProgress({ userId, roadmapSlug }) {
  if (!roadmapSlug) {
    throw new RoadmapProgressError("Roadmap slug is required.", 400, "INVALID_SLUG");
  }

  const progress = await prisma.userRoadmapProgress.findUnique({
    where: {
      userId_roadmapSlug: {
        userId,
        roadmapSlug: String(roadmapSlug).trim().toLowerCase(),
      },
    },
  });

  if (!progress) {
    return {
      roadmapSlug,
      completedTopics: [],
      currentTopic: null,
      progressPercent: 0,
      lastActivityAt: null,
      isEnrolled: false,
    };
  }

  return {
    ...progress,
    isEnrolled: true,
  };
}

/**
 * Toggle topic completion and update progress percentage
 */
async function toggleTopicCompletion({
  userId,
  roadmapSlug,
  topicId,
  totalTopicsCount = 10,
}) {
  if (!roadmapSlug || !topicId) {
    throw new RoadmapProgressError("Roadmap slug and topic ID are required.", 400, "INVALID_INPUT");
  }

  const cleanSlug = String(roadmapSlug).trim().toLowerCase();
  const cleanTopicId = String(topicId).trim();

  const existing = await prisma.userRoadmapProgress.findUnique({
    where: {
      userId_roadmapSlug: {
        userId,
        roadmapSlug: cleanSlug,
      },
    },
  });

  let completedTopics = existing?.completedTopics || [];

  if (completedTopics.includes(cleanTopicId)) {
    // Unmark
    completedTopics = completedTopics.filter((t) => t !== cleanTopicId);
  } else {
    // Mark completed
    completedTopics.push(cleanTopicId);
  }

  const total = Math.max(1, parseInt(totalTopicsCount, 10) || 10);
  const percent = Math.min(100, Math.round((completedTopics.length / total) * 100));

  const updated = await prisma.userRoadmapProgress.upsert({
    where: {
      userId_roadmapSlug: {
        userId,
        roadmapSlug: cleanSlug,
      },
    },
    create: {
      userId,
      roadmapSlug: cleanSlug,
      completedTopics,
      currentTopic: cleanTopicId,
      progressPercent: percent,
      lastActivityAt: new Date(),
    },
    update: {
      completedTopics,
      currentTopic: cleanTopicId,
      progressPercent: percent,
      lastActivityAt: new Date(),
    },
  });

  return updated;
}

/**
 * List all active enrolled roadmap tracks for user
 */
async function listUserTracks({ userId }) {
  return prisma.userRoadmapProgress.findMany({
    where: { userId },
    orderBy: { lastActivityAt: "desc" },
  });
}

/**
 * Create a custom learning roadmap in PostgreSQL
 */
async function createCustomRoadmap({
  userId,
  title,
  description = "",
  category = "role",
  isPublic = false,
  phases = [],
}) {
  if (!title || typeof title !== "string" || !title.trim()) {
    throw new RoadmapProgressError("Roadmap title is required.", 400, "INVALID_TITLE");
  }

  return prisma.$transaction(async (tx) => {
    const roadmap = await tx.roadmap.create({
      data: {
        userId,
        title: title.trim(),
        description: description ? String(description).trim() : "",
        category: category || "role",
        isPublic: Boolean(isPublic),
        slug: title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      },
    });

    if (Array.isArray(phases) && phases.length > 0) {
      for (let i = 0; i < phases.length; i++) {
        const phaseData = phases[i];
        const phase = await tx.roadmapPhase.create({
          data: {
            roadmapId: roadmap.id,
            title: phaseData.title || `Phase ${i + 1}`,
            order: i,
          },
        });

        if (Array.isArray(phaseData.tasks)) {
          for (let j = 0; j < phaseData.tasks.length; j++) {
            const task = phaseData.tasks[j];
            await tx.roadmapTask.create({
              data: {
                roadmapPhaseId: phase.id,
                title: typeof task === "string" ? task : task.title || `Task ${j + 1}`,
                description: task.description || "",
                order: j,
              },
            });
          }
        }
      }
    }

    return tx.roadmap.findUnique({
      where: { id: roadmap.id },
      include: {
        phases: {
          include: { tasks: true },
        },
      },
    });
  });
}

/**
 * List custom roadmaps created by user
 */
async function listCustomRoadmaps({ userId }) {
  return prisma.roadmap.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      phases: {
        include: { tasks: true },
      },
    },
  });
}

module.exports = {
  getRoadmapProgress,
  toggleTopicCompletion,
  listUserTracks,
  createCustomRoadmap,
  listCustomRoadmaps,
  RoadmapProgressError,
};
