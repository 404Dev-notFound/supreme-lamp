const { Router } = require("express");
const roadmapProgressController = require("../controllers/roadmapProgress.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = Router();

// GET /api/roadmaps/tracks/my - List all enrolled/in-progress tracks for authenticated user
router.get("/tracks/my", requireAuth, roadmapProgressController.listMyTracks);

// GET /api/roadmaps/custom/my - List user-created custom roadmaps
router.get("/custom/my", requireAuth, roadmapProgressController.listCustomRoadmaps);

// POST /api/roadmaps/custom - Create custom roadmap
router.post("/custom", requireAuth, roadmapProgressController.createCustomRoadmap);

// GET /api/roadmaps/:slug/progress - Get progress for specific roadmap
router.get("/:slug/progress", requireAuth, roadmapProgressController.getProgress);

// POST /api/roadmaps/:slug/enroll - Explicitly enroll in roadmap track
router.post("/:slug/enroll", requireAuth, roadmapProgressController.enrollTrack);

// POST /api/roadmaps/:slug/progress/toggle - Toggle completion for a topic in roadmap
router.post("/:slug/progress/toggle", requireAuth, roadmapProgressController.toggleTopic);

module.exports = { roadmapProgressRouter: router };
