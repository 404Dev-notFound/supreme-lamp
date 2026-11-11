const { Router } = require("express");
const { requireAuth } = require("../middleware/auth.middleware");
const controller = require("../controllers/personalizedRoadmaps.controller");

const router = Router();

// All personalized roadmap routes strictly enforce authenticated session
router.use(requireAuth);

router.get("/", controller.listUserRoadmaps);
router.post("/", controller.createPersonalizedRoadmap);
router.get("/:id", controller.getRoadmapById);
router.post("/:id/progress", controller.updateTopicProgress);
router.delete("/:id", controller.deletePersonalizedRoadmap);

module.exports = { personalizedRoadmapsRouter: router };

