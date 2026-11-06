const { projectTutorialsService } = require("../services/projectTutorials.service");

/**
 * Controller for Project-Building Tutorials endpoints
 */

class ProjectTutorialsController {
  async list(req, res, next) {
    try {
      const currentUserId = req.user?.id || null;
      const result = await projectTutorialsService.listProjects(req.validatedQuery, currentUserId);
      return res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  async getCategories(req, res, next) {
    try {
      const categories = await projectTutorialsService.getCategories();
      return res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (err) {
      next(err);
    }
  }

  async getLanguages(req, res, next) {
    try {
      const languages = await projectTutorialsService.getLanguages();
      return res.status(200).json({
        success: true,
        data: languages,
      });
    } catch (err) {
      next(err);
    }
  }

  async getBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      const currentUserId = req.user?.id || null;
      const tutorial = await projectTutorialsService.getProjectBySlug(slug, currentUserId);

      if (!tutorial) {
        return res.status(404).json({
          success: false,
          code: "NOT_FOUND",
          error: `Project tutorial with slug '${slug}' not found.`,
        });
      }

      return res.status(200).json({
        success: true,
        data: tutorial,
      });
    } catch (err) {
      next(err);
    }
  }

  async start(req, res, next) {
    try {
      const { id } = req.params;
      const progress = await projectTutorialsService.startProject(req.user.id, id);
      return res.status(201).json({
        success: true,
        data: progress,
        message: "Project started successfully.",
      });
    } catch (err) {
      if (err.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          code: "NOT_FOUND",
          error: err.message,
        });
      }
      next(err);
    }
  }

  async updateStep(req, res, next) {
    try {
      const { id, stepNumber } = req.params;
      const { isCompleted, notes } = req.validatedBody;

      const progress = await projectTutorialsService.updateStepProgress(
        req.user.id,
        id,
        parseInt(stepNumber, 10),
        isCompleted,
        notes
      );

      return res.status(200).json({
        success: true,
        data: progress,
        message: isCompleted ? "Step marked as completed." : "Step marked as incomplete.",
      });
    } catch (err) {
      if (err.message.includes("not found") || err.message.includes("does not exist")) {
        return res.status(404).json({
          success: false,
          code: "NOT_FOUND",
          error: err.message,
        });
      }
      next(err);
    }
  }

  async complete(req, res, next) {
    try {
      const { id } = req.params;
      const progress = await projectTutorialsService.completeProject(req.user.id, id);
      return res.status(200).json({
        success: true,
        data: progress,
        message: "Congratulations! You have completed this project.",
      });
    } catch (err) {
      if (err.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          code: "NOT_FOUND",
          error: err.message,
        });
      }
      next(err);
    }
  }

  async getMyProgress(req, res, next) {
    try {
      const list = await projectTutorialsService.getUserProgressList(req.user.id);
      return res.status(200).json({
        success: true,
        data: list,
      });
    } catch (err) {
      next(err);
    }
  }

  async toggleBookmark(req, res, next) {
    try {
      const { id } = req.params;
      const result = await projectTutorialsService.toggleBookmark(req.user.id, id);
      return res.status(200).json({
        success: true,
        data: result,
        message: result.bookmarked ? "Project saved to bookmarks." : "Project removed from bookmarks.",
      });
    } catch (err) {
      next(err);
    }
  }

  async getMyBookmarks(req, res, next) {
    try {
      const bookmarks = await projectTutorialsService.getUserBookmarks(req.user.id);
      return res.status(200).json({
        success: true,
        data: bookmarks,
      });
    } catch (err) {
      next(err);
    }
  }
}

const projectTutorialsController = new ProjectTutorialsController();

module.exports = {
  projectTutorialsController,
  ProjectTutorialsController,
};

