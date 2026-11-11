const {
  personalizedRoadmapsService,
  PersonalizedRoadmapError,
} = require("../services/personalizedRoadmaps.service");
const { successResponse, errorResponse } = require("../utils/response");

/**
 * GET /api/personalized-roadmaps
 * List all personalized roadmaps belonging to the authenticated user.
 */
async function listUserRoadmaps(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await personalizedRoadmapsService.getUserRoadmaps(req.user.id, {
      page,
      limit,
    });

    return successResponse(res, {
      data: result.roadmaps,
      meta: { pagination: result.pagination },
      message: "Personalized roadmaps retrieved.",
      req,
    });
  } catch (err) {
    if (err instanceof PersonalizedRoadmapError) {
      return errorResponse(res, {
        statusCode: err.statusCode,
        code: err.code,
        message: err.message,
        req,
      });
    }
    next(err);
  }
}

/**
 * GET /api/personalized-roadmaps/:id
 * Retrieve a single personalized roadmap with its full interactive graph nodes & edges.
 */
async function getRoadmapById(req, res, next) {
  try {
    const { id } = req.params;
    const roadmap = await personalizedRoadmapsService.getRoadmapById(id, req.user);

    return successResponse(res, {
      data: roadmap,
      message: "Roadmap graph retrieved successfully.",
      req,
    });
  } catch (err) {
    if (err instanceof PersonalizedRoadmapError) {
      return errorResponse(res, {
        statusCode: err.statusCode,
        code: err.code,
        message: err.message,
        req,
      });
    }
    next(err);
  }
}

/**
 * POST /api/personalized-roadmaps
 * Save a newly generated RAG roadmap to PostgreSQL.
 */
async function createPersonalizedRoadmap(req, res, next) {
  try {
    const { rawRagOutput, query, experienceLevel, goals, pipeline } = req.body || {};

    if (!rawRagOutput) {
      return errorResponse(res, {
        statusCode: 400,
        message: "rawRagOutput payload is required.",
        req,
      });
    }

    const saved = await personalizedRoadmapsService.saveGeneratedRoadmap(
      req.user.id,
      rawRagOutput,
      { query, experienceLevel, goals, pipeline }
    );

    return successResponse(res, {
      data: saved,
      message: "Personalized roadmap and graph persisted successfully.",
      statusCode: 201,
      req,
    });
  } catch (err) {
    if (err instanceof PersonalizedRoadmapError) {
      return errorResponse(res, {
        statusCode: err.statusCode,
        code: err.code,
        message: err.message,
        req,
      });
    }
    next(err);
  }
}

/**
 * POST /api/personalized-roadmaps/:id/progress
 * Update topic completion status and synchronize overall progress.
 */
async function updateTopicProgress(req, res, next) {
  try {
    const { id } = req.params;
    const { stepId, nodeId, status } = req.body || {};
    const targetKey = stepId || nodeId;

    if (!targetKey || !status) {
      return errorResponse(res, {
        statusCode: 400,
        message: "stepId (or nodeId) and status are required.",
        req,
      });
    }

    const result = await personalizedRoadmapsService.updateTopicProgress(
      id,
      targetKey,
      status,
      req.user
    );

    return successResponse(res, {
      data: result,
      message: "Topic progress synchronized to database.",
      req,
    });
  } catch (err) {
    if (err instanceof PersonalizedRoadmapError) {
      return errorResponse(res, {
        statusCode: err.statusCode,
        code: err.code,
        message: err.message,
        req,
      });
    }
    next(err);
  }
}

/**
 * DELETE /api/personalized-roadmaps/:id
 * Delete a personalized roadmap owned by the authenticated user.
 */
async function deletePersonalizedRoadmap(req, res, next) {
  try {
    const { id } = req.params;
    const result = await personalizedRoadmapsService.deleteRoadmap(id, req.user);

    return successResponse(res, {
      data: result,
      message: "Personalized roadmap deleted.",
      req,
    });
  } catch (err) {
    if (err instanceof PersonalizedRoadmapError) {
      return errorResponse(res, {
        statusCode: err.statusCode,
        code: err.code,
        message: err.message,
        req,
      });
    }
    next(err);
  }
}

module.exports = {
  listUserRoadmaps,
  getRoadmapById,
  createPersonalizedRoadmap,
  updateTopicProgress,
  deletePersonalizedRoadmap,
};

