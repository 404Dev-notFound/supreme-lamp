const { prisma } = require("../lib/prisma");

class DashboardServiceError extends Error {
  constructor(message, statusCode = 500, code = "DASHBOARD_SERVICE_ERROR") {
    super(message);
    this.name = "DashboardServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Enterprise Centralized Dashboard Service
 *
 * Fetches strictly account-scoped, database-backed metrics for the authenticated user.
 * Prevents cross-account data leakage by enforcing userId on every Prisma query.
 */
class DashboardService {
  /**
   * Retrieve full dashboard data payload for an authenticated user account
   */
  async getAccountDashboard(userId) {
    if (!userId || typeof userId !== "string") {
      throw new DashboardServiceError(
        "Valid authenticated user ID is required.",
        401,
        "UNAUTHORIZED",
      );
    }

    // Parallelize all independent account-scoped database queries across models
    const [
      user,
      membership,
      roadmapProgressList,
      projectProgressList,
      projectBookmarks,
      resourceBookmarks,
      savedJobs,
      jobApplications,
      resumeAnalysis,
      userSkills,
      dsaSolvedList,
      activityLogs,
    ] = await Promise.all([
      // 1. User Account & Profile
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          headline: true,
          bio: true,
          location: true,
          image: true,
          createdAt: true,
          profile: {
            select: {
              headline: true,
              bio: true,
              location: true,
              githubUrl: true,
              linkedinUrl: true,
              websiteUrl: true,
            },
          },
        },
      }),

      // 2. Active Membership
      prisma.userMembership.findUnique({
        where: { userId },
        select: {
          tier: true,
          status: true,
          expiresAt: true,
          autoRenew: true,
        },
      }),

      // 3. User Enrolled Roadmaps & Progress
      prisma.userRoadmapProgress.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 20,
      }),

      // 4. User Project Tutorials Progress
      prisma.userProjectProgress.findMany({
        where: { userId },
        include: {
          project: {
            select: {
              id: true,
              slug: true,
              title: true,
              difficulty: true,
              categorySlug: true,
              language: true,
              estimatedHours: true,
            },
          },
        },
        orderBy: { lastActivityAt: "desc" },
        take: 20,
      }),

      // 5. User Bookmarked Projects
      prisma.projectBookmark.findMany({
        where: { userId },
        include: {
          project: {
            select: {
              id: true,
              slug: true,
              title: true,
              difficulty: true,
              categorySlug: true,
              language: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),

      // 6. User Bookmarked Resources
      prisma.resourceBookmark.findMany({
        where: { userId },
        include: {
          resource: {
            select: {
              id: true,
              slug: true,
              title: true,
              badge: true,
              accessLevel: true,
              categorySlug: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),

      // 7. User Saved Jobs
      prisma.savedJob.findMany({
        where: { userId },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              location: true,
              workMode: true,
              company: {
                select: {
                  name: true,
                  logo: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),

      // 8. User Job Applications
      prisma.jobApplication.findMany({
        where: { userId },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              company: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { appliedAt: "desc" },
        take: 10,
      }),

      // 9. Latest ATS Resume Analysis
      prisma.resumeAnalysis.findFirst({
        where: {
          resume: {
            userId,
          },
        },
        orderBy: { createdAt: "desc" },
        select: {
          overallScore: true,
          atsScore: true,
          verdict: true,
          verdictReason: true,
          strengths: true,
          flaws: true,
          createdAt: true,
        },
      }),

      // 10. User Skills
      prisma.userSkill.findMany({
        where: { userId },
        include: {
          skill: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
        orderBy: { proficiency: "desc" },
        take: 20,
      }),

      // 11. User Solved DSA Problems
      prisma.userDsaProgress.findMany({
        where: { userId, isSolved: true },
        select: {
          problemSlug: true,
          language: true,
          solvedAt: true,
        },
        orderBy: { solvedAt: "desc" },
      }),

      // 12. User Activity History Logs
      prisma.userActivityLog.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
    ]);

    if (!user) {
      throw new DashboardServiceError(
        "Account not found.",
        404,
        "USER_NOT_FOUND",
      );
    }

    // ========================================================
    // Aggregate Dynamic Metrics & KPIs
    // ========================================================
    const totalRoadmaps = roadmapProgressList.length;
    const completedRoadmaps = roadmapProgressList.filter(
      (r) => (r.progressPercent || 0) >= 100 || r.isCompleted,
    ).length;
    const activeRoadmaps = roadmapProgressList.filter(
      (r) => (r.progressPercent || 0) < 100 && !r.isCompleted,
    );

    const avgRoadmapProgress =
      totalRoadmaps > 0
        ? Math.round(
            roadmapProgressList.reduce(
              (acc, curr) => acc + (curr.progressPercent || 0),
              0,
            ) / totalRoadmaps,
          )
        : 0;

    const totalTutorials = projectProgressList.length;
    const completedTutorials = projectProgressList.filter(
      (p) => p.status === "COMPLETED",
    ).length;
    const inProgressTutorials = projectProgressList.filter(
      (p) => p.status === "IN_PROGRESS",
    );

    const dsaSolvedCount = dsaSolvedList.length;
    const totalSavedResources =
      projectBookmarks.length + resourceBookmarks.length;
    const atsScore = resumeAnalysis?.atsScore ?? null;

    // Dynamically calculate Career Readiness Score based purely on real database data
    let readinessComponents = [];
    if (atsScore !== null) {
      readinessComponents.push({ score: atsScore, weight: 0.30 });
    }
    if (totalRoadmaps > 0) {
      readinessComponents.push({ score: avgRoadmapProgress, weight: 0.30 });
    }
    if (dsaSolvedCount > 0) {
      const dsaScore = Math.min(100, dsaSolvedCount * 10);
      readinessComponents.push({ score: dsaScore, weight: 0.20 });
    }
    if (totalTutorials > 0) {
      const tutorialScore = Math.min(
        100,
        Math.round((completedTutorials / totalTutorials) * 100),
      );
      readinessComponents.push({ score: tutorialScore, weight: 0.10 });
    }
    if (userSkills.length > 0) {
      const skillScore = Math.min(100, userSkills.length * 10);
      readinessComponents.push({ score: skillScore, weight: 0.10 });
    }

    let careerReadinessScore = 0;
    if (readinessComponents.length > 0) {
      const totalWeight = readinessComponents.reduce(
        (acc, c) => acc + c.weight,
        0,
      );
      const weightedSum = readinessComponents.reduce(
        (acc, c) => acc + c.score * c.weight,
        0,
      );
      careerReadinessScore = Math.round(weightedSum / totalWeight);
    }

    // ========================================================
    // Truthful Learning Streak Calculation
    // ========================================================
    const activityDatesSet = new Set();
    const addDate = (d) => {
      if (d) {
        const dateObj = new Date(d);
        if (!isNaN(dateObj.getTime())) {
          activityDatesSet.add(dateObj.toISOString().slice(0, 10));
        }
      }
    };

    activityLogs.forEach((l) => addDate(l.createdAt));
    roadmapProgressList.forEach((r) => addDate(r.updatedAt || r.lastActivityAt));
    projectProgressList.forEach((p) => addDate(p.lastActivityAt || p.startedAt));
    dsaSolvedList.forEach((s) => addDate(s.solvedAt));

    const sortedDates = Array.from(activityDatesSet).sort().reverse();
    let currentStreak = 0;
    if (sortedDates.length > 0) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

      let checkDate = null;
      if (sortedDates[0] === todayStr) {
        checkDate = new Date();
      } else if (sortedDates[0] === yesterdayStr) {
        checkDate = new Date(Date.now() - 86400000);
      }

      if (checkDate) {
        let expected = new Date(checkDate);
        for (const dStr of sortedDates) {
          const expectedStr = expected.toISOString().slice(0, 10);
          if (dStr === expectedStr) {
            currentStreak++;
            expected.setDate(expected.getDate() - 1);
          } else {
            break;
          }
        }
      }
    }

    // ========================================================
    // Truthful Personal Achievements
    // ========================================================
    const achievements = [];
    if (totalRoadmaps >= 1) {
      achievements.push({
        id: "ach-first-track",
        title: "Track Explorer",
        description: "Enrolled in your first engineering roadmap track.",
        badge: "EXPLORER",
        icon: "Compass",
      });
    }
    if (completedRoadmaps >= 1) {
      achievements.push({
        id: "ach-track-finisher",
        title: "Curriculum Master",
        description: "Fully completed a developer learning roadmap.",
        badge: "MASTER",
        icon: "CheckCircle2",
      });
    }
    if (dsaSolvedCount >= 1) {
      achievements.push({
        id: "ach-dsa-first",
        title: "Algorithm Solver",
        description: `Solved ${dsaSolvedCount} Data Structure & Algorithm problem${dsaSolvedCount > 1 ? "s" : ""}.`,
        badge: "ALGO",
        icon: "Code",
      });
    }
    if (completedTutorials >= 1) {
      achievements.push({
        id: "ach-proj-builder",
        title: "Software Builder",
        description: `Built and completed ${completedTutorials} real-world software project tutorial${completedTutorials > 1 ? "s" : ""}.`,
        badge: "BUILDER",
        icon: "Hammer",
      });
    }
    if (atsScore && atsScore >= 85) {
      achievements.push({
        id: "ach-elite-resume",
        title: "Verified Elite Resume",
        description: `Achieved ${atsScore}/100 ATS resume verification score.`,
        badge: "VERIFIED",
        icon: "Sparkles",
      });
    }
    if (currentStreak >= 3) {
      achievements.push({
        id: "ach-streak-active",
        title: "Consistent Learner",
        description: `Maintained a ${currentStreak}-day continuous learning streak.`,
        badge: "STREAK",
        icon: "Flame",
      });
    }

    // ========================================================
    // Build Unified Chronological Recent Activity Feed
    // ========================================================
    const activityFeed = [];

    // 1. Explicit activity logs
    activityLogs.forEach((l) => {
      activityFeed.push({
        id: `log-${l.id}`,
        type: l.activityType,
        title: l.title || `${l.activityType.replace(/_/g, " ")}: ${l.entityId || ""}`,
        subtitle: l.entityType ? `${l.entityType}` : "Platform Interaction",
        timestamp: l.createdAt,
        icon: l.activityType.includes("ROADMAP")
          ? "Compass"
          : l.activityType.includes("DSA")
            ? "Code"
            : l.activityType.includes("TUTORIAL")
              ? "Hammer"
              : "Sparkles",
        color: l.activityType.includes("COMPLETE") || l.activityType.includes("SOLVE")
          ? "emerald"
          : "orange",
        link: l.entityType === "ROADMAP"
          ? `/roadmaps/${l.entityId}`
          : l.entityType === "TUTORIAL"
            ? `/project-tutorials/${l.entityId}`
            : "/dashboard",
      });
    });

    // 2. Roadmaps activity
    roadmapProgressList.forEach((r) => {
      activityFeed.push({
        id: `act-rm-${r.id}`,
        type: "ROADMAP_PROGRESS",
        title: `Progress updated on ${r.roadmapSlug || "roadmap"}`,
        subtitle: `${r.progressPercent || 0}% complete (${r.completedTopics?.length || 0} topics finished)`,
        timestamp: r.updatedAt,
        icon: "Compass",
        color: "orange",
        link: `/roadmaps/${r.roadmapSlug}`,
      });
    });

    // 3. Project Tutorials activity
    projectProgressList.forEach((p) => {
      const isComplete = p.status === "COMPLETED";
      activityFeed.push({
        id: `act-proj-${p.id}`,
        type: isComplete ? "TUTORIAL_COMPLETED" : "TUTORIAL_PROGRESS",
        title: isComplete
          ? `Completed ${p.project?.title || "project tutorial"}`
          : `Working on ${p.project?.title || "project tutorial"}`,
        subtitle: isComplete
          ? "All steps verified & completed"
          : `Step ${p.currentStepNumber || 1} • ${p.progressPercent || 0}% complete`,
        timestamp: p.lastActivityAt || p.startedAt,
        icon: "Hammer",
        color: isComplete ? "emerald" : "amber",
        link: p.project?.slug
          ? `/project-tutorials/${p.project.slug}`
          : "/project-tutorials",
      });
    });

    // 4. DSA activity
    dsaSolvedList.slice(0, 5).forEach((s) => {
      activityFeed.push({
        id: `act-dsa-${s.problemSlug}`,
        type: "DSA_SOLVED",
        title: `Mastered DSA algorithm: ${s.problemSlug}`,
        subtitle: s.language ? `Solved in ${s.language}` : "Algorithm solved",
        timestamp: s.solvedAt,
        icon: "Code",
        color: "emerald",
        link: "/dsa",
      });
    });

    // Sort combined feed descending by timestamp and deduplicate by title+day
    activityFeed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const seenActivities = new Set();
    const recentActivity = [];
    for (const item of activityFeed) {
      const day = item.timestamp
        ? new Date(item.timestamp).toISOString().slice(0, 10)
        : "";
      const dedupeKey = `${item.title}-${day}`;
      if (!seenActivities.has(dedupeKey)) {
        seenActivities.add(dedupeKey);
        recentActivity.push(item);
        if (recentActivity.length >= 10) break;
      }
    }

    return {
      user: {
        id: user.id,
        name: user.name || user.email?.split("@")[0] || "Developer",
        email: user.email,
        role: user.role,
        status: user.status,
        headline: user.headline || user.profile?.headline || null,
        bio: user.bio || null,
        location: user.location || user.profile?.location || null,
        image: user.image || null,
        joinedAt: user.createdAt,
      },
      membership: {
        tier: membership?.tier || (user.role === "ADMIN" ? "PREMIUM" : "FREE"),
        status: membership?.status || "ACTIVE",
        expiresAt: membership?.expiresAt || null,
        isPremium:
          (membership?.tier === "PREMIUM" && membership?.status === "ACTIVE") ||
          user.role === "ADMIN",
      },
      kpis: {
        careerReadinessScore,
        activeRoadmapsCount: activeRoadmaps.length,
        completedRoadmapsCount: completedRoadmaps,
        totalEnrolledRoadmaps: totalRoadmaps,
        avgRoadmapProgress,
        dsaProblemsSolvedCount: dsaSolvedCount,
        tutorialsStartedCount: totalTutorials,
        tutorialsCompletedCount: completedTutorials,
        tutorialsInProgressCount: inProgressTutorials.length,
        bookmarkedProjectsCount: projectBookmarks.length,
        bookmarkedResourcesCount: resourceBookmarks.length,
        totalSavedResources,
        savedJobsCount: savedJobs.length,
        jobApplicationsCount: jobApplications.length,
        skillsCount: userSkills.length,
        resumeAtsScore: atsScore,
        currentStreak,
        resumeAnalysis: resumeAnalysis
          ? {
              overallScore: resumeAnalysis.overallScore,
              atsScore: resumeAnalysis.atsScore,
              verdict: resumeAnalysis.verdict,
              verdictReason: resumeAnalysis.verdictReason,
              analyzedAt: resumeAnalysis.createdAt,
            }
          : null,
      },
      enrolledRoadmaps: roadmapProgressList.map((r) => ({
        id: r.id,
        slug: r.roadmapSlug,
        percentComplete: r.progressPercent || 0,
        isCompleted: r.isCompleted || (r.progressPercent || 0) >= 100,
        completedTopicsCount: r.completedTopics?.length || 0,
        updatedAt: r.updatedAt,
      })),
      activeTutorials: projectProgressList.map((p) => ({
        id: p.id,
        status: p.status,
        currentStep: p.currentStepNumber,
        percentComplete: p.progressPercent || 0,
        completedStepsCount: p.completedStepCount || 0,
        lastActivityAt: p.lastActivityAt,
        project: p.project,
      })),
      dsaSolved: dsaSolvedList.map((s) => ({
        slug: s.problemSlug,
        language: s.language,
        solvedAt: s.solvedAt,
      })),
      bookmarks: projectBookmarks.map((b) => ({
        id: b.id,
        createdAt: b.createdAt,
        project: b.project,
      })),
      savedJobs: savedJobs.map((s) => ({
        id: s.id,
        createdAt: s.createdAt,
        job: s.job,
      })),
      skills: userSkills.map((s) => ({
        id: s.id,
        name: s.skill?.name || "Skill",
        category: s.skill?.category || "General",
        proficiency: s.proficiency,
        verified: s.isVerified,
      })),
      achievements,
      recentActivity,
    };
  }
}

module.exports = new DashboardService();
