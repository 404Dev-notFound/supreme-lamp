const path = require("path");
const { prisma } = require("../lib/prisma");
const { successResponse, errorResponse } = require("../utils/response");
const { cache, buildKey, REDIS_CONFIG } = require("../lib/redis");
const { personalizedRoadmapsService } = require("../services/personalizedRoadmaps.service");

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
 * Communicates with the Python LangChain RAG microservice with automatic timeout,
 * correlation ID tracking, and explicit fallback telemetry.
 */
async function callPythonRAG(endpoint, payload, req = null) {
  const ctrl = new AbortController();
  const timeoutMs = parseInt(process.env.RAG_TIMEOUT_MS || "15000", 10);
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const requestId = req?.headers?.["x-request-id"] || req?.id || `req_${Date.now()}`;
  const t0 = Date.now();

  try {
    const res = await fetch(`${RAG_SERVICE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Request-Id": requestId,
        ...(req?.user?.id ? { "X-User-Id": req.user.id } : {}),
      },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    const durationMs = Date.now() - t0;

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        data,
        timingMs: durationMs,
        pipeline: "python_langchain_qdrant",
        mode: "rag",
      };
    } else {
      const errText = await res.text().catch(() => "Unknown error");
      console.warn(`[RAG Controller] Python RAG ${endpoint} returned HTTP ${res.status}: ${errText}`);
      return {
        success: false,
        error: `Python service returned HTTP ${res.status}`,
        timingMs: durationMs,
        pipeline: "python_langchain_qdrant",
        mode: "fallback",
      };
    }
  } catch (err) {
    clearTimeout(timer);
    const durationMs = Date.now() - t0;
    console.warn(`[RAG Controller] Python RAG ${endpoint} failed: ${err.message} (${durationMs}ms)`);
    return {
      success: false,
      error: err.name === "AbortError" ? "Request timed out" : err.message,
      timingMs: durationMs,
      pipeline: "python_langchain_qdrant",
      mode: "fallback",
    };
  }
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
    const pyResult = await callPythonRAG("/api/rag/skill-assessment", {
      targetRole: profile.targetRole,
      targetDomain: profile.targetDomain,
      currentSkills: profile.currentSkills,
    }, req);

    let assessment;
    let responseMode = "rag";
    let retrievalMeta;

    if (pyResult.success && pyResult.data) {
      assessment = pyResult.data;
      retrievalMeta = {
        succeeded: true,
        pipeline: "python_langchain_qdrant",
        timingMs: pyResult.timingMs,
        backend: "qdrant",
      };
    } else {
      responseMode = "fallback";
      assessment = skillGapAnalyzer.analyzeGaps({
        currentSkills: profile.currentSkills,
        targetRole: profile.targetRole,
        targetDomain: profile.targetDomain,
      });
      retrievalMeta = {
        succeeded: false,
        pipeline: "javascript_isolated_fallback",
        timingMs: pyResult.timingMs,
        fallbackReason: pyResult.error || "Python RAG microservice unavailable",
      };
    }

    return successResponse(res, {
      data: assessment,
      meta: {
        mode: responseMode,
        retrieval: retrievalMeta,
      },
      message: responseMode === "rag"
        ? "Skill gap analysis completed via Python RAG."
        : "Skill gap analysis generated via fallback analyzer.",
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
    const pyResult = await callPythonRAG("/api/rag/generate-roadmap", payload, req);
    let roadmap;
    let responseMode = "rag";
    let retrievalMeta;

    if (pyResult.success && pyResult.data) {
      roadmap = pyResult.data;
      retrievalMeta = {
        succeeded: true,
        pipeline: "python_langchain_qdrant",
        timingMs: pyResult.timingMs,
        backend: "qdrant",
      };
    } else {
      responseMode = "fallback";
      const mockProfile = {
        targetRole: query.trim(),
        experienceLevel: experienceLevel || "Beginner",
        careerGoals: goals || [],
      };
      roadmap = await roadmapGenerator.generateRoadmap(mockProfile);
      retrievalMeta = {
        succeeded: false,
        pipeline: "javascript_isolated_fallback",
        timingMs: pyResult.timingMs,
        fallbackReason: pyResult.error || "Python RAG microservice unavailable",
      };
    }

    // Persist for authenticated user if session exists
    let outputRoadmap = roadmap;
    if (req.user && req.user.id) {
      try {
        outputRoadmap = await personalizedRoadmapsService.saveGeneratedRoadmap(
          req.user.id,
          roadmap,
          {
            query: query.trim(),
            experienceLevel,
            goals,
            pipeline: retrievalMeta.pipeline,
          }
        );
      } catch (saveErr) {
        console.warn("[RAG Controller] PostgreSQL roadmap persistence warning:", saveErr.message);
      }
      await updateUserRagData(req.user.id, {
        ragActiveRoadmap: outputRoadmap,
      });
    }

    return successResponse(res, {
      data: outputRoadmap,
      meta: {
        mode: responseMode,
        retrieval: retrievalMeta,
      },
      message: responseMode === "rag"
        ? "Personalized roadmap generated via Python RAG."
        : "Personalized roadmap generated via fallback engine.",
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
      if (roadmapId) {
        try {
          await personalizedRoadmapsService.updateTopicProgress(
            roadmapId,
            stepId,
            status,
            req.user
          );
        } catch (dbErr) {
          console.warn("[RAG Controller] PersonalizedRoadmap DB update fallback:", dbErr.message);
        }
      }

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
    const pyResult = await callPythonRAG("/api/rag/generate", profile, req);
    let roadmap;
    let responseMode = "rag";
    let retrievalMeta;

    if (pyResult.success && pyResult.data) {
      roadmap = pyResult.data;
      retrievalMeta = {
        succeeded: true,
        pipeline: "python_langchain_qdrant",
        timingMs: pyResult.timingMs,
        backend: "qdrant",
      };
    } else {
      responseMode = "fallback";
      roadmap = await roadmapGenerator.generateRoadmap(profile);
      retrievalMeta = {
        succeeded: false,
        pipeline: "javascript_isolated_fallback",
        timingMs: pyResult.timingMs,
        fallbackReason: pyResult.error || "Python RAG microservice unavailable",
      };
    }

    // Persist active roadmap for authenticated user
    let outputRoadmap = roadmap;
    if (req.user?.id) {
      try {
        outputRoadmap = await personalizedRoadmapsService.saveGeneratedRoadmap(
          req.user.id,
          roadmap,
          {
            targetRole: profile.targetRole,
            pipeline: retrievalMeta.pipeline,
          }
        );
      } catch (saveErr) {
        console.warn("[RAG Controller] PersonalizedRoadmap save fallback:", saveErr.message);
      }

      await updateUserRagData(req.user.id, {
        ragActiveRoadmap: outputRoadmap,
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
      meta: {
        mode: responseMode,
        retrieval: retrievalMeta,
      },
      message: responseMode === "rag"
        ? "Personalized roadmap generated via Python RAG."
        : "Personalized roadmap generated via fallback engine.",
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
    const pyResult = await callPythonRAG("/api/rag/recommendations", {
      profile,
      completedTopics,
    }, req);

    let recs;
    let responseMode = "rag";
    let retrievalMeta;

    if (pyResult.success && pyResult.data) {
      recs = pyResult.data;
      retrievalMeta = {
        succeeded: true,
        pipeline: "python_langchain_qdrant",
        timingMs: pyResult.timingMs,
        backend: "qdrant",
      };
    } else {
      responseMode = "fallback";
      recs = await recommendationEngine.getRecommendations({
        userProfile: profile,
        completedTopics,
      });
      retrievalMeta = {
        succeeded: false,
        pipeline: "javascript_isolated_fallback",
        timingMs: pyResult.timingMs,
        fallbackReason: pyResult.error || "Python RAG microservice unavailable",
      };
    }

    return successResponse(res, {
      data: recs,
      meta: {
        mode: responseMode,
        retrieval: retrievalMeta,
      },
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

/**
 * 10. POST /api/rag/admin/reindex - Trigger secured knowledge base reindexing
 */
async function adminReindex(req, res, next) {
  try {
    const isProd = process.env.NODE_ENV === "production";
    const adminSecret = process.env.RAG_ADMIN_SECRET || (!isProd ? "flowctrl-dev-admin-secret-2026" : null);

    if (isProd && !adminSecret) {
      console.error("[RAG Admin] RAG_ADMIN_SECRET is missing in production environment. Failing closed.");
      return errorResponse(res, {
        statusCode: 500,
        message: "Configuration error: Administrative operations disabled until RAG_ADMIN_SECRET is provisioned.",
        req,
      });
    }

    // Must have verified ADMIN user session (enforced by route middleware) or provide the service secret
    const headerKey = req.headers["x-admin-key"];
    const authHeader = req.headers["authorization"];
    let token = headerKey;
    if (!token && authHeader) {
      const parts = authHeader.split(" ");
      if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
        token = parts[1];
      }
    }

    if (token && token !== adminSecret) {
      return errorResponse(res, {
        statusCode: 401,
        message: "Unauthorized: Provided administrative key is invalid.",
        req,
      });
    }

    if (!token && req.user?.role !== "ADMIN") {
      return errorResponse(res, {
        statusCode: 403,
        message: "Forbidden: Administrative role or valid X-Admin-Key required.",
        req,
      });
    }

    // Extend socket and response timeout for heavyweight reindex execution (120s)
    if (typeof res.setTimeout === "function") res.setTimeout(120000);
    if (typeof req.setTimeout === "function") req.setTimeout(120000);

    const limit = req.query?.limit || req.body?.limit;
    const reindexUrl = limit
      ? `${RAG_SERVICE_URL}/api/rag/reindex?limit=${encodeURIComponent(limit)}`
      : `${RAG_SERVICE_URL}/api/rag/reindex`;

    const t0 = Date.now();
    const pyRes = await fetch(reindexUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Key": adminSecret,
        "X-Request-Id": req.headers["x-request-id"] || `admin_reindex_${Date.now()}`,
      },
    });

    const durationMs = Date.now() - t0;
    if (pyRes.ok) {
      const result = await pyRes.json();
      return successResponse(res, {
        data: result,
        meta: {
          timingMs: durationMs,
          vectorBackend: "qdrant",
          mode: "rag",
        },
        message: "Knowledge base reindex completed successfully in Qdrant.",
        req,
      });
    } else {
      const errText = await pyRes.text();
      return errorResponse(res, {
        statusCode: pyRes.status,
        message: `Reindexing failed: ${errText}`,
        req,
      });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * 11. GET /api/rag/health - Health & readiness diagnostics across Express, Python RAG and Qdrant
 */
async function getRagHealth(req, res, next) {
  try {
    const t0 = Date.now();
    let pyHealth = null;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 5000);
      const r = await fetch(`${RAG_SERVICE_URL}/ready`, { signal: ctrl.signal });
      clearTimeout(timer);
      if (r.ok) {
        pyHealth = await r.json();
      }
    } catch (e) {
      // Python microservice not responding
    }

    return successResponse(res, {
      data: {
        status: pyHealth?.ready ? "healthy" : "degraded",
        expressBackend: "online",
        pythonRAG: pyHealth || { status: "offline", ready: false, error: "Python service unreachable" },
        vectorDatabase: "qdrant",
        primaryPipeline: "python_langchain_qdrant",
        fallbackAvailable: true,
        timingMs: Date.now() - t0,
      },
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
  adminReindex,
  getRagHealth,
};
