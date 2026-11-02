const projectsService = require("../services/projects.service");
const {
  validateProjectId,
  validateIssueId,
  validateCreateProject,
  validateUpdateProject,
  validateCreateIssue,
  validateUpdateIssue,
} = require("../validators/projects.validator");

class ProjectsController {
  async getProjects(req, res, next) {
    try {
      const { category, difficulty, search } = req.query;
      const projects = await projectsService.listProjects({
        category,
        difficulty,
        search,
      });

      res.setHeader("Cache-Control", "no-store, max-age=0");
      return res.status(200).json({
        success: true,
        count: projects.length,
        data: projects,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProjectById(req, res, next) {
    try {
      const validId = validateProjectId(req.params.id);
      if (!validId.isValid) {
        return res.status(400).json({
          success: false,
          code: "INVALID_IDENTIFIER",
          error: validId.error,
        });
      }

      const project = await projectsService.getProjectById(validId.id);
      if (!project) {
        return res.status(404).json({
          success: false,
          code: "PROJECT_NOT_FOUND",
          error: "Project not found.",
        });
      }

      res.setHeader("Cache-Control", "no-store, max-age=0");
      return res.status(200).json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  async createProject(req, res, next) {
    try {
      const userId = req.user.id;
      const validation = validateCreateProject(req.body);

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          code: "VALIDATION_ERROR",
          error: validation.errors[0] || "Invalid project data.",
          details: validation.errors,
        });
      }

      const newProject = await projectsService.createProject(
        userId,
        validation.sanitized,
      );

      res.setHeader("Cache-Control", "no-store, max-age=0");
      return res.status(201).json({
        success: true,
        message: "Project created and persisted successfully.",
        data: newProject,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProject(req, res, next) {
    try {
      const validId = validateProjectId(req.params.id);
      if (!validId.isValid) {
        return res.status(400).json({
          success: false,
          code: "INVALID_IDENTIFIER",
          error: validId.error,
        });
      }

      const validation = validateUpdateProject(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          code: "VALIDATION_ERROR",
          error: validation.errors[0] || "Invalid update data.",
          details: validation.errors,
        });
      }

      const updated = await projectsService.updateProject(
        validId.id,
        req.user,
        validation.sanitized,
      );

      res.setHeader("Cache-Control", "no-store, max-age=0");
      return res.status(200).json({
        success: true,
        message: "Project updated successfully.",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteProject(req, res, next) {
    try {
      const validId = validateProjectId(req.params.id);
      if (!validId.isValid) {
        return res.status(400).json({
          success: false,
          code: "INVALID_IDENTIFIER",
          error: validId.error,
        });
      }

      const result = await projectsService.deleteProject(validId.id, req.user);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getProjectIssues(req, res, next) {
    try {
      const validId = validateProjectId(req.params.projectId);
      if (!validId.isValid) {
        return res.status(400).json({
          success: false,
          code: "INVALID_IDENTIFIER",
          error: validId.error,
        });
      }

      const issues = await projectsService.listProjectIssues(validId.id);

      res.setHeader("Cache-Control", "no-store, max-age=0");
      return res.status(200).json({
        success: true,
        count: issues.length,
        data: issues,
      });
    } catch (error) {
      next(error);
    }
  }

  async createProjectIssue(req, res, next) {
    try {
      const validId = validateProjectId(req.params.projectId);
      if (!validId.isValid) {
        return res.status(400).json({
          success: false,
          code: "INVALID_IDENTIFIER",
          error: validId.error,
        });
      }

      const validation = validateCreateIssue(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          code: "VALIDATION_ERROR",
          error: validation.errors[0] || "Invalid issue data.",
          details: validation.errors,
        });
      }

      const newIssue = await projectsService.createProjectIssue(
        validId.id,
        req.user.id,
        validation.sanitized,
      );

      res.setHeader("Cache-Control", "no-store, max-age=0");
      return res.status(201).json({
        success: true,
        message: "Issue created and persisted successfully.",
        data: newIssue,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProjectIssue(req, res, next) {
    try {
      const validProjId = validateProjectId(req.params.projectId);
      const validIssueId = validateIssueId(req.params.issueId);

      if (!validProjId.isValid || !validIssueId.isValid) {
        return res.status(400).json({
          success: false,
          code: "INVALID_IDENTIFIER",
          error: "Valid project and issue identifiers required.",
        });
      }

      const validation = validateUpdateIssue(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          code: "VALIDATION_ERROR",
          error: validation.errors[0] || "Invalid issue update data.",
          details: validation.errors,
        });
      }

      const updated = await projectsService.updateProjectIssue(
        validProjId.id,
        validIssueId.id,
        validation.sanitized,
      );

      res.setHeader("Cache-Control", "no-store, max-age=0");
      return res.status(200).json({
        success: true,
        message: "Issue updated successfully.",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteProjectIssue(req, res, next) {
    try {
      const validProjId = validateProjectId(req.params.projectId);
      const validIssueId = validateIssueId(req.params.issueId);

      if (!validProjId.isValid || !validIssueId.isValid) {
        return res.status(400).json({
          success: false,
          code: "INVALID_IDENTIFIER",
          error: "Valid project and issue identifiers required.",
        });
      }

      const result = await projectsService.deleteProjectIssue(
        validProjId.id,
        validIssueId.id,
      );
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProjectsController();

