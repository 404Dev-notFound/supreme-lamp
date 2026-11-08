const { Router } = require("express");
const { dsaController } = require("../controllers/dsa.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = Router();

// User authenticated DSA progress routes (must be defined before /:slug to prevent slug clash)
router.get("/progress/my", requireAuth, (req, res, next) =>
  dsaController.getMyProgress(req, res, next)
);

router.post("/:slug/solve", requireAuth, (req, res, next) =>
  dsaController.toggleSolveProblem(req, res, next)
);

// Public catalog routes
router.get("/languages", (req, res, next) =>
  dsaController.getLanguages(req, res, next)
);
router.get("/categories", (req, res, next) =>
  dsaController.getCategories(req, res, next)
);
router.get("/:slug", (req, res, next) =>
  dsaController.getAlgorithmBySlug(req, res, next)
);
router.get("/", (req, res, next) =>
  dsaController.getAlgorithms(req, res, next)
);

module.exports = { dsaRouter: router };
