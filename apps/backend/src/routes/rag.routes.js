const { Router } = require("express");
const ragController = require("../controllers/rag.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = Router();

// All RAG routes strictly require authenticated sessions (never trust client IDs)
router.use(requireAuth);

// 1. Career Goal Questionnaire & Profile
router.get("/profile", ragController.getProfile);
router.post("/profile", ragController.saveProfile);

// 2. User Skill Assessment & Gaps
router.post("/skill-assessment", ragController.assessSkills);
router.get("/skill-gaps", ragController.getSkillGaps);

// 3. Personalized Roadmap Generation & Retrieval
router.post("/generate", ragController.generateRoadmap);
router.get("/roadmap", ragController.getRoadmap);

// 4. Adaptive Dynamic Recommendations
router.get("/recommendations", ragController.getRecommendations);
router.post("/recommendations/refresh", ragController.getRecommendations);

// 5. Progress Tracking & Topic Progress Toggle
router.post("/progress/toggle", ragController.toggleTopicProgress);

// 6. Mission Control / Dashboard Progress Integration
router.get("/dashboard", ragController.getDashboard);

module.exports = { ragRouter: router };
