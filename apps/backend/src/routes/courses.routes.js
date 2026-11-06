const { Router } = require("express");
const { coursesController } = require("../controllers/courses.controller");

const router = Router();

router.get("/:slug", (req, res, next) => coursesController.getCourseBySlug(req, res, next));
router.get("/", (req, res, next) => coursesController.getCourses(req, res, next));

module.exports = { coursesRouter: router };

