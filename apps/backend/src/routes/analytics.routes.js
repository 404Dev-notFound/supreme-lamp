const { Router } = require("express");
const { analyticsController } = require("../controllers/analytics.controller");
const { optionalAuth, requireAuth } = require("../middleware/auth.middleware");

const router = Router();

// POST /api/analytics/events - Track an interaction event (authenticated or anonymous)
router.post("/events", optionalAuth, (req, res, next) =>
  analyticsController.trackEvent(req, res, next)
);

// GET /api/analytics/roadmaps/:slug - Public engagement analytics for a specific roadmap
router.get("/roadmaps/:slug", (req, res, next) =>
  analyticsController.getRoadmapAnalytics(req, res, next)
);

// GET /api/analytics/platform - Admin platform-wide overview
router.get("/platform", requireAuth, (req, res, next) =>
  analyticsController.getPlatformOverview(req, res, next)
);

module.exports = { analyticsRouter: router };

