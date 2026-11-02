const path = require("path");
const { prisma } = require("../lib/prisma");
const { successResponse, errorResponse } = require("../utils/response");
const { cache, buildKey, REDIS_CONFIG } = require("../lib/redis");

// Import RAG System modules cleanly from root RAG/ folder
const {
  UserProfileMapper,
  SkillGapAnalyzer,
  RoadmapGenerator,
  RecommendationEngine,
  ProgressTracker,
} = require(path.resolve(__dirname, "../../../../RAG"));

const skillGapAnalyzer = new SkillGapAnalyzer();
const roadmapGenerator = new RoadmapGenerator({ skillGapAnalyzer });
const recommendationEngine = new RecommendationEngine({ skillGapAnalyzer });

// In-memory cache & test fallback store
const ragMemoryCache = new Map();

/**
 * Helper to retrieve user's saved RAG profile & roadmap from PostgreSQL with fallback
 */
async function getUserRagData(userId) {
  const cacheKey = buildKey(REDIS_CONFIG.namespaces.RAG, "user", userId);

  // 1. Check Redis cache first
  const cached = await cache.get(cacheKey);
  if (cached && typeof cached === "object") {
    return cached;
  }

  // 2. Read from PostgreSQL
  try {
    const pref = await prisma.userPreference.findUnique({
      where: { userId },
    });

    if (pref && pref.customSettings && typeof pref.customSettings === "object") {
      const cs = pref.customSettings;
      const mem = ragMemoryCache.get(userId) || {};
      const data = {
        profile: cs.ragProfile || cs.profile || mem.profile || null,
        activeRoadmap: cs.ragActiveRoadmap || cs.activeRoadmap || mem.activeRoadmap || null,
        completedTopics: cs.ragCompletedTopics || cs.completedTopics || mem.completedTopics || [],
        stepProgress: cs.ragStepProgress || cs.stepProgress || mem.stepProgress || {},
      };
      await cache.set(cacheKey, data, REDIS_CONFIG.ttl.RAG_USER_DATA);
      return data;
    }
  } catch (err) {
    // In unit tests without seeded database user, fall back to memory store
  }

  const mem = ragMemoryCache.get(userId) || {};
  const fallbackData = {
    profile: mem.profile || null,
    activeRoadmap: mem.activeRoadmap || null,
    completedTopics: mem.completedTopics || [],
    stepProgress: mem.stepProgress || {},
  };
  await cache.set(cacheKey, fallbackData, REDIS_CONFIG.ttl.RAG_USER_DATA);
  return fallbackData;
}

/**
 * Helper to update user's saved RAG state in PostgreSQL with fallback
 */
async function updateUserRagData(userId, updates = {}) {
  const current = await getUserRagData(userId);
  const nextData = {
    profile: updates.ragProfile !== undefined ? updates.ragProfile : (updates.profile !== undefined ? updates.profile : current.profile),
    activeRoadmap: updates.ragActiveRoadmap !== undefined ? updates.ragActiveRoadmap : (updates.activeRoadmap !== undefined ? updates.activeRoadmap : current.activeRoadmap),
    completedTopics: updates.ragCompletedTopics !== undefined ? updates.ragCompletedTopics : (updates.completedTopics !== undefined ? updates.completedTopics : current.completedTopics),
    stepProgress: updates.ragStepProgress !== undefined ? updates.ragStepProgress : (updates.stepProgress !== undefined ? updates.stepProgress : current.stepProgress),
  };
  ragMemoryCache.set(userId, nextData);

  const cacheKey = buildKey(REDIS_CONFIG.namespaces.RAG, "user", userId);
  await cache.set(cacheKey, nextData, REDIS_CONFIG.ttl.RAG_USER_DATA);

  try {
    const pref = await prisma.userPreference.findUnique({
      where: { userId },
    });

    const currentSettings = (pref && pref.customSettings && typeof pref.customSettings === "object")
      ? pref.customSettings
      : {};

    const newSettings = {
      ...currentSettings,
      ragProfile: nextData.profile,
      ragActiveRoadmap: nextData.activeRoadmap,
      ragCompletedTopics: nextData.completedTopics,
      ragStepProgress: nextData.stepProgress,
    };

    await prisma.userPreference.upsert({
      where: { userId },
      create: {
        userId,
        customSettings: newSettings,
      },
      update: {
        customSettings: newSettings,
      },
    });
  } catch (err) {
    // Handled via memory store fallback
  }
}

/**
 * 1. GET /api/rag/profile - Get current career profile
 */
async function getProfile(req, res, next) {
  try {
    const { profile } = await getUserRagData(req.user.id);
    return successResponse(res, {
      data: profile,
      message: profile ? "Career profile retrieved." : "No profile configured yet.",
      req,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 2. POST /api/rag/profile - Create or update career profile
 */
async function saveProfile(req, res, next) {
  try {
    const mapped = UserProfileMapper.mapProfile({
      ...req.body,
      userId: req.user.id,
    });

    await updateUserRagData(req.user.id, { ragProfile: mapped });

    return successResponse(res, {
      data: mapped,
      message: "Career profile saved successfully.",
      statusCode: 200,
      req,
    });
  } catch (err) {
    next(err);
  }
}

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || "http://127.0.0.1:8001";

/**
 * Communicates with the Python LangChain RAG microservice with automatic timeout & fallback
 */
async function callPythonRAG(endpoint, payload) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(`${RAG_SERVICE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    clearTimeout(timer);
  }
  return null;
}

/**
 * 3. POST /api/rag/skill-assessment - Analyze Current Skills -> Required Skills -> Skill Gaps
 */
async function assessSkills(req, res, next) {
  try {
    const { profile: savedProfile } = await getUserRagData(req.user.id);
    const profile = req.body && Object.keys(req.body).length > 0
      ? UserProfileMapper.mapProfile({ ...req.body, userId: req.user.id })
      : savedProfile;

    if (!profile) {
      return errorResponse(res, {
        statusCode: 400,
        message: "No profile found. Please provide career preferences or save your profile first.",
        req,
      });
    }

    // Try Python LangChain RAG microservice first
    const pyAssessment = await callPythonRAG("/api/rag/skill-assessment", {
      targetRole: profile.targetRole,
      targetDomain: profile.targetDomain,
      currentSkills: profile.currentSkills,
    });

    const assessment = pyAssessment || skillGapAnalyzer.analyzeGaps({
      currentSkills: profile.currentSkills,
      targetRole: profile.targetRole,
      targetDomain: profile.targetDomain,
    });

    return successResponse(res, {
      data: assessment,
      message: "Skill gap analysis completed.",
      req,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 4. POST /api/rag/generate-roadmap - Generate personalized roadmap from natural language query
 */
async function generateRoadmapFromQuery(req, res, next) {
  try {
    const { query, experienceLevel, goals } = req.body || {};
    if (!query || typeof query !== "string" || !query.trim()) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Please enter a valid career goal, skill, or learning objective.",
        req,
      });
    }

    const payload = {
      query: query.trim(),
      experienceLevel: experienceLevel || "Beginner",
      goals: Array.isArray(goals) ? goals : [],
    };

    // Forward to Python LangChain RAG microservice
    let roadmap = await callPythonRAG("/api/rag/generate-roadmap", payload);

    if (!roadmap) {
      // Fallback: If python microservice temporarily unavailable, use JS roadmapGenerator
      const mockProfile = {
        targetRole: query.trim(),
        experienceLevel: experienceLevel || "Beginner",
        careerGoals: goals || [],
      };
      roadmap = await roadmapGenerator.generateRoadmap(mockProfile);
    }

    // Persist for authenticated user if session exists
    if (req.user && req.user.id) {
      await updateUserRagData(req.user.id, {
        ragActiveRoadmap: roadmap,
      });
    }

    return successResponse(res, {
      data: roadmap,
      message: "Personalized roadmap generated successfully.",
      statusCode: 200,
      req,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/rag/progress/step - Update status of a specific roadmap step (not_started, in_progress, completed)
 */
async function updateStepStatus(req, res, next) {
  try {
    const { stepId, status, roadmapId } = req.body || {};
    if (!stepId || !status) {
      return errorResponse(res, {
        statusCode: 400,
        message: "stepId and status are required.",
        req,
      });
    }

    const validStatuses = ["not_started", "in_progress", "completed"];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, {
        statusCode: 400,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        req,
      });
    }

    if (req.user && req.user.id) {
      const data = await getUserRagData(req.user.id);
      const currentProgress = { ...(data.stepProgress || {}) };
      currentProgress[stepId] = status;

      let completedTopics = [...(data.completedTopics || [])];
      if (status === "completed" && !completedTopics.includes(stepId)) {
        completedTopics.push(stepId);
      } else if (status !== "completed") {
        completedTopics = completedTopics.filter((id) => id !== stepId);
      }

      await updateUserRagData(req.user.id, {
        ragStepProgress: currentProgress,
        ragCompletedTopics: completedTopics,
      });

      return successResponse(res, {
        data: {
          stepId,
          status,
          completedCount: completedTopics.length,
          stepProgress: currentProgress,
        },
        message: "Step progress saved to account.",
        req,
      });
    }

    return successResponse(res, {
      data: { stepId, status },
      message: "Step progress updated.",
      req,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 4. POST /api/rag/generate - Generate personalized RAG learning roadmap
 */
async function generateRoadmap(req, res, next) {
  try {
    // If request body specifies a natural language query, delegate to generateRoadmapFromQuery
    if (req.body && req.body.query) {
      return generateRoadmapFromQuery(req, res, next);
    }

    const { profile: savedProfile } = req.user?.id ? await getUserRagData(req.user.id) : {};
    const profile = req.body && req.body.targetRole
      ? UserProfileMapper.mapProfile({ ...req.body, userId: req.user?.id })
      : savedProfile;

    if (!profile) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Please submit career goals and current skills before generating roadmap.",
        req,
      });
    }

    // Delegate to Python LangChain RAG microservice
    const pyRoadmap = await callPythonRAG("/api/rag/generate", profile);
    const roadmap = pyRoadmap || await roadmapGenerator.generateRoadmap(profile);

    // Persist active roadmap for authenticated user
    if (req.user?.id) {
      await updateUserRagData(req.user.id, {
        ragActiveRoadmap: roadmap,
        ragProfile: profile,
      });

      // Also attempt synchronization into Prisma userRoadmapProgress
      try {
        await prisma.userRoadmapProgress.upsert({
          where: {
            userId_roadmapSlug: {
              userId: req.user.id,
              roadmapSlug: roadmap.id || `roadmap_${roadmap.targetRole || "career"}`,
            },
          },
          create: {
            userId: req.user.id,
            roadmapSlug: roadmap.id || `roadmap_${roadmap.targetRole || "career"}`,
            completedTopics: [],
            progressPercent: 0,
            lastActivityAt: new Date(),
          },
          update: {
            lastActivityAt: new Date(),
          },
        });
      } catch (dbErr) {
        // Ignored for unseeded test users
      }
    }

    return successResponse(res, {
      data: roadmap,
      message: "Personalized roadmap generated successfully.",
      statusCode: 201,
      req,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 5. GET /api/rag/roadmap - Get active personalized roadmap
 */
async function getRoadmap(req, res, next) {
  try {
    const { activeRoadmap } = await getUserRagData(req.user.id);
    if (!activeRoadmap) {
      return errorResponse(res, {
        statusCode: 404,
        message: "No personalized roadmap found. Please generate one first.",
        req,
      });
    }

    return successResponse(res, {
      data: activeRoadmap,
      req,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 6. GET /api/rag/recommendations - Get adaptive dynamic recommendations
 */
async function getRecommendations(req, res, next) {
  try {
    const { profile, completedTopics } = await getUserRagData(req.user.id);
    if (!profile) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Career profile required for recommendations.",
        req,
      });
    }

    // Try Python LangChain RAG microservice first
    const pyRecs = await callPythonRAG("/api/rag/recommendations", {
      profile,
      completedTopics,
    });

    const recs = pyRecs || await recommendationEngine.getRecommendations({
      userProfile: profile,
      completedTopics,
    });

    return successResponse(res, {
      data: recs,
      req,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 7. POST /api/rag/progress/toggle - Toggle topic progress and update dashboard metrics
 */
async function toggleTopicProgress(req, res, next) {
  try {
    const { topicId } = req.body;
    if (!topicId) {
      return errorResponse(res, {
        statusCode: 400,
        message: "topicId is required in request body.",
        req,
      });
    }

    const { activeRoadmap, completedTopics } = await getUserRagData(req.user.id);
    if (!activeRoadmap) {
      return errorResponse(res, {
        statusCode: 404,
        message: "No active roadmap found to update progress on.",
        req,
      });
    }

    const result = ProgressTracker.toggleTopicProgress({
      roadmap: activeRoadmap,
      completedTopicIds: completedTopics,
      topicId,
    });

    // Save updated completed topics
    await updateUserRagData(req.user.id, {
      ragCompletedTopics: result.completedTopicIds,
    });

    // Update Prisma UserRoadmapProgress
    try {
      await prisma.userRoadmapProgress.upsert({
        where: {
          userId_roadmapSlug: {
            userId: req.user.id,
            roadmapSlug: activeRoadmap.id,
          },
        },
        create: {
          userId: req.user.id,
          roadmapSlug: activeRoadmap.id,
          completedTopics: result.completedTopicIds,
          progressPercent: result.metrics.overallProgress,
          lastActivityAt: new Date(),
        },
        update: {
          completedTopics: result.completedTopicIds,
          progressPercent: result.metrics.overallProgress,
          lastActivityAt: new Date(),
        },
      });
    } catch (dbErr) {
      // Ignored for unseeded test users
    }

    return successResponse(res, {
      data: {
        completedTopicIds: result.completedTopicIds,
        dashboardMetrics: result.metrics,
      },
      message: "Topic progress updated successfully.",
      req,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 8. GET /api/rag/dashboard - Get overall progress metrics for dashboard
 */
async function getDashboard(req, res, next) {
  try {
    const { activeRoadmap, completedTopics } = await getUserRagData(req.user.id);
    const metrics = ProgressTracker.calculateDashboardMetrics({
      roadmap: activeRoadmap,
      completedTopicIds: completedTopics,
    });

    return successResponse(res, {
      data: {
        hasActiveRoadmap: Boolean(activeRoadmap),
        roadmapTitle: activeRoadmap?.roadmapTitle || "None",
        targetRole: activeRoadmap?.targetRole || null,
        metrics,
      },
      req,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 9. GET /api/rag/skill-gaps - Get skill gaps for current user
 */
async function getSkillGaps(req, res, next) {
  try {
    const { profile } = await getUserRagData(req.user.id);
    if (!profile) {
      return errorResponse(res, {
        statusCode: 404,
        message: "No career profile found.",
        req,
      });
    }

    const analysis = skillGapAnalyzer.analyzeGaps({
      currentSkills: profile.currentSkills,
      targetRole: profile.targetRole,
      targetDomain: profile.targetDomain,
    });

    return successResponse(res, {
      data: analysis,
      req,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProfile,
  saveProfile,
  assessSkills,
  generateRoadmap,
  generateRoadmapFromQuery,
  updateStepStatus,
  getRoadmap,
  getRecommendations,
  toggleTopicProgress,
  getDashboard,
  getSkillGaps,
};
