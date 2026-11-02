const { Router } = require("express");
const roadmapsController = require("../controllers/roadmaps.controller");
const { attachMembership } = require("../middleware/membership.middleware");

const router = Router();

// Soft-attach verified membership for entitlement-aware catalog & roadmap data
router.use(attachMembership);

// GET /api/roadmaps - List all roadmaps with search and filter
router.get("/", (req, res, next) =>
  roadmapsController.getRoadmaps(req, res, next),
);

// GET /api/roadmaps/:slug - Get full roadmap graph and details
router.get("/:slug", (req, res, next) =>
  roadmapsController.getRoadmapBySlug(req, res, next),
);

// GET /api/roadmaps/:slug/topics/:topicId - Get specific topic detail
router.get("/:slug/topics/:topicId", (req, res, next) =>
  roadmapsController.getTopicDetail(req, res, next),
);

module.exports = { roadmapsRouter: router };

