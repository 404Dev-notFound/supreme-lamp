const { prisma } = require("../lib/prisma");

// In-memory rapid deduplication cache: key -> timestamp (5 second TTL)
const recentEventsCache = new Map();

function cleanDedupeCache() {
  const now = Date.now();
  for (const [key, timestamp] of recentEventsCache.entries()) {
    if (now - timestamp > 10000) {
      recentEventsCache.delete(key);
    }
  }
}
setInterval(cleanDedupeCache, 30000).unref();

class AnalyticsService {
  /**
   * Record a platform analytics event with deduplication and counter aggregation
   */
  async recordEvent({
    userId = null,
    visitorId = null,
    eventType,
    entityType,
    entityId,
    metadata = null,
    ipAddress = null,
    userAgent = null,
  }) {
    if (!eventType || !entityType || !entityId) {
      return { recorded: false, reason: "Missing required event fields" };
    }

    const cleanEventType = String(eventType).trim().toUpperCase();
    const cleanEntityType = String(entityType).trim().toUpperCase();
    const cleanEntityId = String(entityId).trim();
    const actorKey = userId ? `u:${userId}` : `v:${visitorId || "anon"}`;
    const dedupeKey = `${actorKey}:${cleanEventType}:${cleanEntityType}:${cleanEntityId}`;

    const now = Date.now();
    const lastSeen = recentEventsCache.get(dedupeKey);
    if (lastSeen && now - lastSeen < 5000) {
      // Deduplicated within 5 second throttle window
      return { recorded: true, deduplicated: true };
    }
    recentEventsCache.set(dedupeKey, now);

    // Sanitize metadata to guarantee no passwords, tokens or secrets are logged
    let safeMetadata = null;
    if (metadata && typeof metadata === "object") {
      safeMetadata = { ...metadata };
      delete safeMetadata.password;
      delete safeMetadata.token;
      delete safeMetadata.sessionToken;
      delete safeMetadata.secret;
      delete safeMetadata.authorization;
    }

    // Check if this visitor/user has performed this exact event on this entity before
    let isUnique = false;
    try {
      const existing = await prisma.platformAnalyticsEvent.findFirst({
        where: {
          OR: [
            ...(userId ? [{ userId }] : []),
            ...(visitorId ? [{ visitorId }] : []),
          ],
          eventType: cleanEventType,
          entityType: cleanEntityType,
          entityId: cleanEntityId,
        },
        select: { id: true },
      });
      isUnique = !existing;
    } catch {
      isUnique = true;
    }

    // Persist event record
    const event = await prisma.platformAnalyticsEvent.create({
      data: {
        userId: userId || null,
        visitorId: visitorId || null,
        eventType: cleanEventType,
        entityType: cleanEntityType,
        entityId: cleanEntityId,
        metadata: safeMetadata,
        ipAddress: ipAddress ? String(ipAddress).slice(0, 45) : null,
        userAgent: userAgent ? String(userAgent).slice(0, 255) : null,
      },
    });

    // Update aggregate counters
    try {
      await this.updateEntityCounters({
        entityType: cleanEntityType,
        entityId: cleanEntityId,
        eventType: cleanEventType,
        isUnique,
        isAuthenticated: Boolean(userId),
      });
    } catch (err) {
      console.warn("Analytics counter update error:", err.message);
    }

    // Record UserActivityLog for meaningful learning interactions
    if (userId) {
      try {
        await this.logUserLearningActivity({
          userId,
          eventType: cleanEventType,
          entityType: cleanEntityType,
          entityId: cleanEntityId,
          metadata: safeMetadata,
        });
      } catch (err) {
        console.warn("User activity log error:", err.message);
      }
    }

    return { recorded: true, eventId: event.id, isUnique };
  }

  /**
   * Atomically maintain aggregate interaction counters per entity
   */
  async updateEntityCounters({
    entityType,
    entityId,
    eventType,
    isUnique,
    isAuthenticated,
  }) {
    const isView = eventType === "VIEW" || eventType === "DETAIL_VIEW";
    const isEnroll = eventType === "ENROLL" || eventType === "START";
    const isComplete = eventType === "COMPLETE";

    // Upsert counter record
    return prisma.entityInteractionCounter.upsert({
      where: {
        entityType_entityId: {
          entityType,
          entityId,
        },
      },
      create: {
        entityType,
        entityId,
        totalViews: isView ? 1 : 0,
        uniqueVisitorsCount: isView && isUnique ? 1 : 0,
        authVisitorsCount: isView && isAuthenticated ? 1 : 0,
        totalEnrollments: isEnroll ? 1 : 0,
        uniqueEnrolledCount: isEnroll && isUnique ? 1 : 0,
        completedCount: isComplete ? 1 : 0,
        activeLearnersCount: isEnroll ? 1 : 0,
        lastInteractionAt: new Date(),
      },
      update: {
        ...(isView && {
          totalViews: { increment: 1 },
          ...(isUnique && { uniqueVisitorsCount: { increment: 1 } }),
          ...(isAuthenticated && { authVisitorsCount: { increment: 1 } }),
        }),
        ...(isEnroll && {
          totalEnrollments: { increment: 1 },
          ...(isUnique && {
            uniqueEnrolledCount: { increment: 1 },
            activeLearnersCount: { increment: 1 },
          }),
        }),
        ...(isComplete && {
          completedCount: { increment: 1 },
          activeLearnersCount: { decrement: 1 },
        }),
        lastInteractionAt: new Date(),
      },
    });
  }

  /**
   * Log high-value user learning activities into UserActivityLog
   */
  async logUserLearningActivity({
    userId,
    eventType,
    entityType,
    entityId,
    metadata,
  }) {
    let activityType = null;
    let title = null;

    if (eventType === "ENROLL" || eventType === "START") {
      activityType = entityType === "ROADMAP" ? "ROADMAP_ENROLL" : "TUTORIAL_START";
      title = `Enrolled in ${entityType.toLowerCase()}: ${entityId}`;
    } else if (eventType === "COMPLETE") {
      activityType = entityType === "ROADMAP" ? "ROADMAP_COMPLETE" : "TUTORIAL_COMPLETE";
      title = `Completed ${entityType.toLowerCase()}: ${entityId}`;
    } else if (eventType === "SOLVE") {
      activityType = "DSA_SOLVED";
      title = `Solved DSA problem: ${entityId}`;
    } else if (eventType === "BOOKMARK") {
      activityType = "BOOKMARK_ADD";
      title = `Bookmarked ${entityType.toLowerCase()}: ${entityId}`;
    } else if (eventType === "PROGRESS") {
      activityType = "ROADMAP_PROGRESS";
      title = `Updated progress in ${entityId}: ${metadata?.progressPercent || 0}%`;
    }

    if (activityType) {
      await prisma.userActivityLog.create({
        data: {
          userId,
          activityType,
          entityType,
          entityId,
          title,
          metadata: metadata || undefined,
        },
      });
    }
  }

  /**
   * Retrieve aggregate statistics for an entity (e.g. roadmap, tutorial)
   */
  async getEntityAnalytics({ entityType, entityId }) {
    const cleanType = String(entityType).trim().toUpperCase();
    const cleanId = String(entityId).trim();

    let counter = await prisma.entityInteractionCounter.findUnique({
      where: {
        entityType_entityId: {
          entityType: cleanType,
          entityId: cleanId,
        },
      },
    });

    if (!counter) {
      // Calculate initial baseline from real database records if counter hasn't fired yet
      let totalEnrollments = 0;
      let completedCount = 0;
      let activeLearnersCount = 0;

      if (cleanType === "ROADMAP") {
        const progressList = await prisma.userRoadmapProgress.findMany({
          where: { roadmapSlug: cleanId },
          select: { progressPercent: true, isCompleted: true },
        });
        totalEnrollments = progressList.length;
        completedCount = progressList.filter((p) => p.isCompleted || p.progressPercent === 100).length;
        activeLearnersCount = Math.max(0, totalEnrollments - completedCount);
      } else if (cleanType === "TUTORIAL") {
        const tutProgress = await prisma.userProjectProgress.findMany({
          where: { projectTutorialId: cleanId },
          select: { status: true },
        });
        totalEnrollments = tutProgress.length;
        completedCount = tutProgress.filter((p) => p.status === "COMPLETED").length;
        activeLearnersCount = Math.max(0, totalEnrollments - completedCount);
      }

      const totalViews = await prisma.platformAnalyticsEvent.count({
        where: { entityType: cleanType, entityId: cleanId, eventType: { in: ["VIEW", "DETAIL_VIEW"] } },
      });

      counter = await prisma.entityInteractionCounter.upsert({
        where: {
          entityType_entityId: {
            entityType: cleanType,
            entityId: cleanId,
          },
        },
        create: {
          entityType: cleanType,
          entityId: cleanId,
          totalViews,
          uniqueVisitorsCount: totalViews,
          authVisitorsCount: Math.min(totalViews, totalEnrollments),
          totalEnrollments,
          uniqueEnrolledCount: totalEnrollments,
          completedCount,
          activeLearnersCount,
          lastInteractionAt: new Date(),
        },
        update: {},
      });
    }

    return {
      entityType: cleanType,
      entityId: cleanId,
      totalViews: counter.totalViews,
      uniqueVisitors: counter.uniqueVisitorsCount,
      authenticatedVisitors: counter.authVisitorsCount,
      totalEnrollments: counter.totalEnrollments,
      uniqueEnrolledUsers: counter.uniqueEnrolledCount,
      completedUsers: counter.completedCount,
      activeLearners: Math.max(0, counter.activeLearnersCount),
      lastInteractionAt: counter.lastInteractionAt,
      completionRate:
        counter.totalEnrollments > 0
          ? Math.round((counter.completedCount / counter.totalEnrollments) * 100)
          : 0,
    };
  }

  /**
   * Admin Platform-Wide Analytics Dashboard
   */
  async getPlatformOverview(userRole) {
    if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
      throw new Error("Unauthorized: Administrative privileges required.");
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Parallel platform queries
    const [
      totalUsers,
      activeUsersList,
      newToday,
      newWeek,
      newMonth,
      totalRoadmapEnrollments,
      totalTutorialStarts,
      totalDsaSolved,
      topViewedRoadmaps,
      topEnrolledRoadmaps,
      eventBreakdown,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.userActivityLog.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        distinct: ["userId"],
        select: { userId: true },
      }),
      prisma.user.count({ where: { createdAt: { gte: oneDayAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.userRoadmapProgress.count(),
      prisma.userProjectProgress.count(),
      prisma.userDsaProgress.count({ where: { isSolved: true } }),
      prisma.entityInteractionCounter.findMany({
        where: { entityType: "ROADMAP" },
        orderBy: { totalViews: "desc" },
        take: 5,
      }),
      prisma.entityInteractionCounter.findMany({
        where: { entityType: "ROADMAP" },
        orderBy: { totalEnrollments: "desc" },
        take: 5,
      }),
      prisma.platformAnalyticsEvent.groupBy({
        by: ["eventType"],
        _count: { id: true },
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    const completedRoadmaps = await prisma.userRoadmapProgress.count({
      where: { OR: [{ isCompleted: true }, { progressPercent: 100 }] },
    });

    const completionRate =
      totalRoadmapEnrollments > 0
        ? Math.round((completedRoadmaps / totalRoadmapEnrollments) * 100)
        : 0;

    return {
      metrics: {
        totalRegisteredUsers: totalUsers,
        activeUsers30d: activeUsersList.length,
        newRegistrationsToday: newToday,
        newRegistrations7d: newWeek,
        newRegistrations30d: newMonth,
        totalRoadmapEnrollments,
        completedRoadmaps,
        roadmapCompletionRate: `${completionRate}%`,
        totalTutorialStarts,
        totalDsaProblemsSolved: totalDsaSolved,
      },
      topRoadmapsByViews: topViewedRoadmaps.map((r) => ({
        slug: r.entityId,
        views: r.totalViews,
        uniqueVisitors: r.uniqueVisitorsCount,
      })),
      topRoadmapsByEnrollments: topEnrolledRoadmaps.map((r) => ({
        slug: r.entityId,
        enrollments: r.totalEnrollments,
        completions: r.completedCount,
        activeLearners: r.activeLearnersCount,
      })),
      featureEngagement30d: eventBreakdown.map((e) => ({
        eventType: e.eventType,
        count: e._count.id,
      })),
    };
  }
}

const analyticsService = new AnalyticsService();
module.exports = { analyticsService };

