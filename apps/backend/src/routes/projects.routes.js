const { Router } = require("express");
const projectsController = require("../controllers/projects.controller");
const { requireAuth, optionalAuth } = require("../middleware/auth.middleware");

const router = Router();

// Project Routes
router.get("/", optionalAuth, (req, res, next) =>
  projectsController.getProjects(req, res, next),
);

router.get("/:id", optionalAuth, (req, res, next) =>
  projectsController.getProjectById(req, res, next),
);

router.post("/", requireAuth, (req, res, next) =>
  projectsController.createProject(req, res, next),
);

router.put("/:id", requireAuth, (req, res, next) =>
  projectsController.updateProject(req, res, next),
);

router.delete("/:id", requireAuth, (req, res, next) =>
  projectsController.deleteProject(req, res, next),
);

// Project Issues Routes
router.get("/:projectId/issues", optionalAuth, (req, res, next) =>
  projectsController.getProjectIssues(req, res, next),
);

router.post("/:projectId/issues", requireAuth, (req, res, next) =>
  projectsController.createProjectIssue(req, res, next),
);

router.patch("/:projectId/issues/:issueId", requireAuth, (req, res, next) =>
  projectsController.updateProjectIssue(req, res, next),
);

router.delete("/:projectId/issues/:issueId", requireAuth, (req, res, next) =>
  projectsController.deleteProjectIssue(req, res, next),
);

module.exports = { projectsRouter: router };
