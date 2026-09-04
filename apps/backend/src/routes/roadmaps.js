const { Router } = require("express");
const {
  getAllRoadmaps,
  getRoadmapBySlug,
  getTopicDetail,
  searchRoadmaps,
} = require("@flowctrl/roadmap-data");

const router = Router();

// GET /api/roadmaps - List all roadmaps with optional search/filtering
router.get("/", (req, res, next) => {
  try {
    const { search, category, level } = req.query;

    let results =
      typeof search === "string" ? searchRoadmaps(search) : getAllRoadmaps();

    if (typeof category === "string" && category.trim()) {
      results = results.filter(
        (r) => r.category.toLowerCase() === category.toLowerCase().trim(),
      );
    }

    if (typeof level === "string" && level.trim()) {
      results = results.filter(
        (r) => r.level.toLowerCase() === level.toLowerCase().trim(),
      );
    }

    res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/roadmaps/:slug - Get full roadmap detail, graph nodes, edges, topics
router.get("/:slug", (req, res, next) => {
  try {
    const slug = String(req.params.slug);
    const roadmap = getRoadmapBySlug(slug);

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        error: {
          message: `Roadmap track '${slug}' was not found.`,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: roadmap,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/roadmaps/:slug/topics/:topicId - Get specific topic detail
router.get("/:slug/topics/:topicId", (req, res, next) => {
  try {
    const slug = String(req.params.slug);
    const topicId = String(req.params.topicId);
    const topic = getTopicDetail(slug, topicId);

    if (!topic) {
      return res.status(404).json({
        success: false,
        error: {
          message: `Topic '${topicId}' was not found in roadmap '${slug}'.`,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: topic,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = {
  roadmapsRouter: router,
};
