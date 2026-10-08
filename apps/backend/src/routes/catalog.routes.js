const { Router } = require("express");
const catalogController = require("../controllers/catalog.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validation.middleware");
const { validateUserSkillInput } = require("../validators/catalog.validator");

const router = Router();

// GET /api/catalog/categories - List skill categories
router.get("/categories", catalogController.listCategories);

// GET /api/catalog/skills - List skills (search & category filter)
router.get("/skills", catalogController.listSkills);

// GET /api/catalog/career-paths - List career paths
router.get("/career-paths", catalogController.listCareerPaths);

// GET /api/catalog/career-paths/:slug - Single career path
router.get("/career-paths/:slug", catalogController.getCareerPathBySlug);

// GET /api/catalog/user-skills - Get current user skills
router.get("/user-skills", requireAuth, catalogController.getUserSkills);

// POST /api/catalog/user-skills - Add/update user skill
router.post(
  "/user-skills",
  requireAuth,
  validate(validateUserSkillInput),
  catalogController.addUserSkill,
);

// DELETE /api/catalog/user-skills/:skillId - Remove user skill
router.delete("/user-skills/:skillId", requireAuth, catalogController.removeUserSkill);

module.exports = { catalogRouter: router };
