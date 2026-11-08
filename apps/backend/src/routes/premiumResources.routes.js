const { Router } = require("express");
const premiumResourcesController = require("../controllers/premiumResources.controller");
const { attachMembership } = require("../middleware/membership.middleware");
const { requireAuth } = require("../middleware/auth.middleware");

const router = Router();

// User authenticated bookmark routes (before /:slug)
router.get("/bookmarks/my", requireAuth, (req, res, next) =>
  premiumResourcesController.getMyBookmarks(req, res, next)
);

router.post("/:slug/bookmark", requireAuth, (req, res, next) =>
  premiumResourcesController.toggleBookmark(req, res, next)
);

// GET /api/resources/categories - List available resource domains/categories
router.get("/categories", (req, res, next) =>
  premiumResourcesController.getCategories(req, res, next)
);

// GET /api/resources - List curated resources (content stripped if not premium)
router.get("/", attachMembership, (req, res, next) =>
  premiumResourcesController.getResources(req, res, next)
);

// GET /api/resources/:slug - Get specific resource (full if premium, preview if free)
router.get("/:slug", attachMembership, (req, res, next) =>
  premiumResourcesController.getResourceBySlug(req, res, next)
);

module.exports = { premiumResourcesRouter: router };
