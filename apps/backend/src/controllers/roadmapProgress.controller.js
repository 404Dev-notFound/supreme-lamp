const roadmapProgressService = require("../services/roadmapProgress.service");
const { successResponse } = require("../utils/response");

async function getProgress(req, res, next) {
  try {
    const { slug } = req.params;
    const progress = await roadmapProgressService.getRoadmapProgress({
      userId: req.user.id,
      roadmapSlug: slug,
    });
    return successResponse(res, { data: progress, req });
  } catch (err) {
    next(err);
  }
}

async function toggleTopic(req, res, next) {
  try {
    const { slug } = req.params;
    const { topicId, totalTopicsCount } = req.body;
    const updated = await roadmapProgressService.toggleTopicCompletion({
      userId: req.user.id,
      roadmapSlug: slug,
      topicId,
      totalTopicsCount,
    });
    return successResponse(res, {
      data: updated,
      message: "Topic progress updated.",
      req,
    });
  } catch (err) {
    next(err);
  }
}

async function listMyTracks(req, res, next) {
  try {
    const tracks = await roadmapProgressService.listUserTracks({
      userId: req.user.id,
    });
    return successResponse(res, { data: tracks, req });
  } catch (err) {
    next(err);
  }
}

async function createCustomRoadmap(req, res, next) {
  try {
    const { title, description, category, isPublic, phases } = req.body;
    const roadmap = await roadmapProgressService.createCustomRoadmap({
      userId: req.user.id,
      title,
      description,
      category,
      isPublic,
      phases,
    });
    return successResponse(res, {
      data: roadmap,
      message: "Custom learning roadmap created.",
      statusCode: 201,
      req,
    });
  } catch (err) {
    next(err);
  }
}

async function listCustomRoadmaps(req, res, next) {
  try {
    const roadmaps = await roadmapProgressService.listCustomRoadmaps({
      userId: req.user.id,
    });
    return successResponse(res, { data: roadmaps, req });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProgress,
  toggleTopic,
  listMyTracks,
  createCustomRoadmap,
  listCustomRoadmaps,
};
