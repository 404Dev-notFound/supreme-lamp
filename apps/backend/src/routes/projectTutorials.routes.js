const express = require("express");
const { projectTutorialsController } = require("../controllers/projectTutorials.controller");
const {
  validateListQuery,
  validateStepProgress,
} = require("../validators/projectTutorials.validator");
const { requireAuth, optionalAuth } = require("../middleware/auth.middleware");

const router = express.Router();

/**
 * Public discovery routes (augmented with user progress if authenticated)
 */
router.get("/", optionalAuth, validateListQuery, (req, res, next) =>
  projectTutorialsController.list(req, res, next)
);

router.get("/categories", (req, res, next) =>
  projectTutorialsController.getCategories(req, res, next)
);

router.get("/languages", (req, res, next) =>
  projectTutorialsController.getLanguages(req, res, next)
);

/**
 * User-specific progress & bookmark routes (require authentication)
 */
router.get("/user/my-progress", requireAuth, (req, res, next) =>
  projectTutorialsController.getMyProgress(req, res, next)
);

router.get("/user/bookmarks", requireAuth, (req, res, next) =>
  projectTutorialsController.getMyBookmarks(req, res, next)
);

/**
 * Detailed project route (public view with optional user progress)
 */
router.get("/:slug", optionalAuth, (req, res, next) =>
  projectTutorialsController.getBySlug(req, res, next)
);

/**
 * State-mutating progress actions (require authentication)
 */
router.post("/:id/start", requireAuth, (req, res, next) =>
  projectTutorialsController.start(req, res, next)
);

router.post("/:id/steps/:stepNumber", requireAuth, validateStepProgress, (req, res, next) =>
  projectTutorialsController.updateStep(req, res, next)
);

router.post("/:id/complete", requireAuth, (req, res, next) =>
  projectTutorialsController.complete(req, res, next)
);

router.post("/:id/bookmark", requireAuth, (req, res, next) =>
  projectTutorialsController.toggleBookmark(req, res, next)
);

module.exports = {
  projectTutorialsRouter: router,
};

