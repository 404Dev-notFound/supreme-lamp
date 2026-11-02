const { Router } = require("express");
const mentorsController = require("../controllers/mentors.controller");
const { requireAuth, optionalAuth } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validation.middleware");
const { validateMentorProfile } = require("../validators/mentors.validator");

const router = Router();

// GET /api/mentors - Browse mentors directory
router.get("/", optionalAuth, mentorsController.listMentors);

// GET /api/mentors/:id - Get specific mentor profile
router.get("/:id", optionalAuth, mentorsController.getMentorById);

// POST /api/mentors/apply - Create or update current user's mentor profile
router.post(
  "/apply",
  requireAuth,
  validate(validateMentorProfile),
  mentorsController.upsertMentorProfile,
);

// PUT /api/mentors/profile - Update mentor profile
router.put(
  "/profile",
  requireAuth,
  validate(validateMentorProfile),
  mentorsController.upsertMentorProfile,
);

// DELETE /api/mentors/:id - Delete mentor profile (Owner or Admin)
router.delete("/:id", requireAuth, mentorsController.deleteMentorProfile);

module.exports = { mentorsRouter: router };
