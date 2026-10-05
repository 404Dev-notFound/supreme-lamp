const { Router } = require("express");
const {
  getAllRoadmaps,
  getRoadmapBySlug,
  getTopicDetail,
  searchRoadmaps,
} = require("@flowctrl/roadmap-data");

const router = Router();

const SAFE_IDENTIFIER_REGEX = /^[a-zA-Z0-9_-]{1,100}$/;

// GET /api/roadmaps - List all roadmaps with sanitized search and filtering
router.get("/", (req, res, next) => {
  try {
    const { search, category, level } = req.query;

    // Sanitize and bound search length to mitigate ReDoS and buffer strain
    let safeSearch = "";
    if (typeof search === "string") {
      safeSearch = search.trim().slice(0, 100);
    }

    let results = safeSearch ? searchRoadmaps(safeSearch) : getAllRoadmaps();

    if (typeof category === "string" && category.trim()) {
      const cleanCategory = category.trim().toLowerCase().slice(0, 50);
      results = results.filter(
        (r) => r.category.toLowerCase() === cleanCategory,
      );
    }

    if (typeof level === "string" && level.trim()) {
      const cleanLevel = level.trim().toLowerCase().slice(0, 50);
      results = results.filter(
        (r) => r.level.toLowerCase() === cleanLevel,
      );
    }

    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300");
    res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/roadmaps/:slug - Get full roadmap detail with path traversal prevention
router.get("/:slug", (req, res, next) => {
  try {
    const slug = String(req.params.slug).trim();

    if (!SAFE_IDENTIFIER_REGEX.test(slug)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_IDENTIFIER",
        error: "Roadmap identifier must contain only alphanumeric characters, underscores, and hyphens.",
      });
    }

    const roadmap = getRoadmapBySlug(slug);

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        code: "ROADMAP_NOT_FOUND",
        error: `Roadmap track '${slug}' was not found.`,
      });
    }

    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300");
    res.status(200).json({
      success: true,
      data: roadmap,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/roadmaps/:slug/topics/:topicId - Get topic detail with strict parameter validation
router.get("/:slug/topics/:topicId", (req, res, next) => {
  try {
    const slug = String(req.params.slug).trim();
    const topicId = String(req.params.topicId).trim();

    if (!SAFE_IDENTIFIER_REGEX.test(slug)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_IDENTIFIER",
        error: "Roadmap identifier contains invalid characters.",
      });
    }

    if (!SAFE_IDENTIFIER_REGEX.test(topicId)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_IDENTIFIER",
        error: "Topic identifier contains invalid characters.",
      });
    }

    const topic = getTopicDetail(slug, topicId);

    if (!topic) {
      return res.status(404).json({
        success: false,
        code: "TOPIC_NOT_FOUND",
        error: `Topic '${topicId}' was not found in roadmap '${slug}'.`,
      });
    }

    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300");
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
