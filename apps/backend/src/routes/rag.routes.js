const { Router } = require("express");
const ragController = require("../controllers/rag.controller");
const { requireAuth, optionalAuth, requireRole } = require("../middleware/auth.middleware");

const router = Router();

// Diagnostics & health across Express and Python RAG microservice
router.get("/health", ragController.getRagHealth);

// Admin-secured knowledge base reindexing: requires verified authenticated ADMIN role
router.post("/admin/reindex", requireAuth, requireRole(["ADMIN"]), ragController.adminReindex);

// 1. Natural Language Roadmap Generation from Search Bar (Open to both guests & authenticated users)
router.post("/generate-roadmap", optionalAuth, ragController.generateRoadmapFromQuery);

// 2. Step progress update (persists for authenticated users, responds gracefully for guests)
router.post("/progress/step", optionalAuth, ragController.updateStepStatus);

// 3. Generation endpoint with optionalAuth (if body contains query or profile)
router.post("/generate", optionalAuth, ragController.generateRoadmap);

// All subsequent RAG profile & dashboard routes require authenticated sessions
router.use(requireAuth);

// 4. Career Goal Questionnaire & Profile
router.get("/profile", ragController.getProfile);
router.post("/profile", ragController.saveProfile);

// 5. User Skill Assessment & Gaps
router.post("/skill-assessment", ragController.assessSkills);
router.get("/skill-gaps", ragController.getSkillGaps);

// 6. Active Roadmap Retrieval
router.get("/roadmap", ragController.getRoadmap);

// 7. Adaptive Dynamic Recommendations
router.get("/recommendations", ragController.getRecommendations);
router.post("/recommendations/refresh", ragController.getRecommendations);

// 8. Progress Tracking & Topic Progress Toggle
router.post("/progress/toggle", ragController.toggleTopicProgress);

// 9. Mission Control / Dashboard Progress Integration
router.get("/dashboard", ragController.getDashboard);

module.exports = { ragRouter: router };
