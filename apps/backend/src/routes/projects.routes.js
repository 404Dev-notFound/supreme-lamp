const { Router } = require("express");
const { prisma } = require("../db");
const { requireAuth, optionalAuth } = require("../middleware/auth.middleware");
const { isSafeUrl } = require("../utils/security");

const router = Router();
const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;

const VALID_ISSUE_STATUSES = ["TODO", "IN_PROGRESS", "DONE"];
const VALID_ISSUE_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

/**
 * GET /api/projects - List all projects with optional filtering
 */
router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const { category, difficulty, search } = req.query;

    const where = {};

    if (typeof category === "string" && category.trim()) {
      where.category = {
        equals: category.trim(),
        mode: "insensitive",
      };
    }

    if (typeof difficulty === "string" && difficulty.trim()) {
      where.difficulty = {
        equals: difficulty.trim(),
        mode: "insensitive",
      };
    }

    if (typeof search === "string" && search.trim()) {
      const q = search.trim().slice(0, 100);
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: {
            issues: true,
            members: true,
          },
        },
      },
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
});

/**
 * GET /api/projects/:id - Retrieve project detail with issues and members
 */
router.get("/:id", optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || !SAFE_ID_REGEX.test(id)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_IDENTIFIER",
        error: "Valid project identifier required.",
      });
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        issues: {
          orderBy: { createdAt: "asc" },
          include: {
            creator: {
              select: { id: true, name: true, email: true },
            },
            assignee: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

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
});

/**
 * POST /api/projects - Create a new project atomically in PostgreSQL
 */
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      title,
      category,
      difficulty,
      techStack,
      image,
      description,
      githubUrl,
      isPinned,
      isDemo,
    } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        error: "Project title is required.",
      });
    }

    let parsedTechStack = [];
    if (Array.isArray(techStack)) {
      parsedTechStack = techStack.map((t) => String(t).trim()).filter(Boolean);
    } else if (typeof techStack === "string") {
      parsedTechStack = techStack
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    let safeGithub = null;
    if (githubUrl && typeof githubUrl === "string" && githubUrl.trim()) {
      const cleanUrl = githubUrl.trim();
      if (isSafeUrl(cleanUrl)) {
        safeGithub = cleanUrl;
      }
    }

    let safeImage = null;
    if (image && typeof image === "string" && image.trim()) {
      const cleanImg = image.trim();
      if (isSafeUrl(cleanImg)) {
        safeImage = cleanImg;
      }
    }

    // Atomic creation of Project and ProjectMember (owner) in transaction
    const newProject = await prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          title: title.trim(),
          category: category ? String(category).trim() : "General",
          difficulty: difficulty ? String(difficulty).trim() : "Intermediate",
          techStack: parsedTechStack,
          image: safeImage,
          description: description ? String(description).trim() : "",
          githubUrl: safeGithub,
          isPinned: Boolean(isPinned),
          isDemo: Boolean(isDemo),
          ownerId: userId,
          members: {
            create: {
              userId,
              projectRole: "owner",
            },
          },
        },
        include: {
          owner: {
            select: { id: true, name: true, email: true },
          },
          members: true,
        },
      });

      return created;
    });

    res.setHeader("Cache-Control", "no-store, max-age=0");
    return res.status(201).json({
      success: true,
      message: "Project created and persisted successfully.",
      data: newProject,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/projects/:id - Update existing project in PostgreSQL
 */
router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!id || !SAFE_ID_REGEX.test(id)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_IDENTIFIER",
        error: "Valid project identifier required.",
      });
    }

    const existing = await prisma.project.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        code: "PROJECT_NOT_FOUND",
        error: "Project not found.",
      });
    }

    // IDOR / Permission check: user must be owner or admin/owner member or platform admin
    const isOwner = existing.ownerId === userId;
    const isMemberAdmin = existing.members.some(
      (m) => m.userId === userId && ["owner", "admin"].includes(m.projectRole),
    );
    const isPlatformAdmin = ["ADMIN", "SUPER_ADMIN"].includes(req.user.role);

    if (!isOwner && !isMemberAdmin && !isPlatformAdmin) {
      return res.status(403).json({
        success: false,
        code: "FORBIDDEN",
        error: "You do not have permission to modify this project.",
      });
    }

    const {
      title,
      category,
      difficulty,
      techStack,
      image,
      description,
      githubUrl,
      isPinned,
      isDemo,
    } = req.body;

    const updateData = {};

    if (title !== undefined && typeof title === "string" && title.trim()) {
      updateData.title = title.trim();
    }
    if (category !== undefined) {
      updateData.category = String(category).trim();
    }
    if (difficulty !== undefined) {
      updateData.difficulty = String(difficulty).trim();
    }
    if (techStack !== undefined) {
      if (Array.isArray(techStack)) {
        updateData.techStack = techStack
          .map((t) => String(t).trim())
          .filter(Boolean);
      } else if (typeof techStack === "string") {
        updateData.techStack = techStack
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }
    if (image !== undefined) {
      updateData.image = image && isSafeUrl(image.trim()) ? image.trim() : null;
    }
    if (description !== undefined) {
      updateData.description = String(description).trim();
    }
    if (githubUrl !== undefined) {
      updateData.githubUrl =
        githubUrl && isSafeUrl(githubUrl.trim()) ? githubUrl.trim() : null;
    }
    if (isPinned !== undefined) {
      updateData.isPinned = Boolean(isPinned);
    }
    if (isDemo !== undefined) {
      updateData.isDemo = Boolean(isDemo);
    }

    const updated = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.setHeader("Cache-Control", "no-store, max-age=0");
    return res.status(200).json({
      success: true,
      message: "Project updated successfully.",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/projects/:id - Delete project and cascade issues/members
 */
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!id || !SAFE_ID_REGEX.test(id)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_IDENTIFIER",
        error: "Valid project identifier required.",
      });
    }

    const existing = await prisma.project.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        code: "PROJECT_NOT_FOUND",
        error: "Project not found.",
      });
    }

    const isOwner = existing.ownerId === userId;
    const isPlatformAdmin = ["ADMIN", "SUPER_ADMIN"].includes(req.user.role);

    if (!isOwner && !isPlatformAdmin) {
      return res.status(403).json({
        success: false,
        code: "FORBIDDEN",
        error:
          "Only the project owner or administrator can delete this project.",
      });
    }

    await prisma.project.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Project and associated records deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/projects/:projectId/issues - List issues for a project
 */
router.get("/:projectId/issues", optionalAuth, async (req, res, next) => {
  try {
    const { projectId } = req.params;

    if (!projectId || !SAFE_ID_REGEX.test(projectId)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_IDENTIFIER",
        error: "Valid project identifier required.",
      });
    }

    const issues = await prisma.issue.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.setHeader("Cache-Control", "no-store, max-age=0");
    return res.status(200).json({
      success: true,
      count: issues.length,
      data: issues,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/projects/:projectId/issues - Create a new issue in project
 */
router.post("/:projectId/issues", requireAuth, async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    if (!projectId || !SAFE_ID_REGEX.test(projectId)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_IDENTIFIER",
        error: "Valid project identifier required.",
      });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        code: "PROJECT_NOT_FOUND",
        error: "Project not found.",
      });
    }

    const { title, description, status, priority, tags, assigneeId } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        error: "Issue title is required.",
      });
    }

    const issueStatus = VALID_ISSUE_STATUSES.includes(status) ? status : "TODO";
    const issuePriority = VALID_ISSUE_PRIORITIES.includes(priority)
      ? priority
      : "MEDIUM";

    let tagsArray = [];
    if (Array.isArray(tags)) {
      tagsArray = tags.map((t) => String(t).trim()).filter(Boolean);
    } else if (typeof tags === "string") {
      tagsArray = tags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    let validAssigneeId = null;
    if (assigneeId && typeof assigneeId === "string" && assigneeId.trim()) {
      const cleanAssignee = assigneeId.trim();
      const assigneeUser = await prisma.user.findUnique({
        where: { id: cleanAssignee },
        select: { id: true },
      });
      if (assigneeUser) {
        validAssigneeId = assigneeUser.id;
      }
    }

    const newIssue = await prisma.issue.create({
      data: {
        title: title.trim(),
        description: description ? String(description).trim() : "",
        status: issueStatus,
        priority: issuePriority,
        tags: tagsArray,
        projectId,
        creatorId: userId,
        assigneeId: validAssigneeId,
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.setHeader("Cache-Control", "no-store, max-age=0");
    return res.status(201).json({
      success: true,
      message: "Issue created and persisted successfully.",
      data: newIssue,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/projects/:projectId/issues/:issueId - Update issue status/fields
 */
router.patch(
  "/:projectId/issues/:issueId",
  requireAuth,
  async (req, res, next) => {
    try {
      const { projectId, issueId } = req.params;

      if (
        !projectId ||
        !SAFE_ID_REGEX.test(projectId) ||
        !issueId ||
        !SAFE_ID_REGEX.test(issueId)
      ) {
        return res.status(400).json({
          success: false,
          code: "INVALID_IDENTIFIER",
          error: "Valid project and issue identifiers required.",
        });
      }

      const existingIssue = await prisma.issue.findFirst({
        where: {
          id: issueId,
          projectId,
        },
      });

      if (!existingIssue) {
        return res.status(404).json({
          success: false,
          code: "ISSUE_NOT_FOUND",
          error: "Issue not found in this project.",
        });
      }

      const { title, description, status, priority, tags, assigneeId } =
        req.body;
      const updateData = {};

      if (title !== undefined && typeof title === "string" && title.trim()) {
        updateData.title = title.trim();
      }
      if (description !== undefined) {
        updateData.description = String(description).trim();
      }
      if (status !== undefined && VALID_ISSUE_STATUSES.includes(status)) {
        updateData.status = status;
      }
      if (priority !== undefined && VALID_ISSUE_PRIORITIES.includes(priority)) {
        updateData.priority = priority;
      }
      if (tags !== undefined) {
        updateData.tags = Array.isArray(tags)
          ? tags.map((t) => String(t).trim()).filter(Boolean)
          : String(tags)
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
      }
      if (assigneeId !== undefined) {
        if (assigneeId === null || assigneeId === "") {
          updateData.assigneeId = null;
        } else {
          const cleanAssignee = String(assigneeId).trim();
          const assigneeExists = await prisma.user.findUnique({
            where: { id: cleanAssignee },
            select: { id: true },
          });
          if (assigneeExists) {
            updateData.assigneeId = assigneeExists.id;
          }
        }
      }

      const updated = await prisma.issue.update({
        where: { id: issueId },
        data: updateData,
        include: {
          creator: {
            select: { id: true, name: true, email: true },
          },
          assignee: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      res.setHeader("Cache-Control", "no-store, max-age=0");
      return res.status(200).json({
        success: true,
        message: "Issue updated successfully.",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * DELETE /api/projects/:projectId/issues/:issueId - Delete issue
 */
router.delete(
  "/:projectId/issues/:issueId",
  requireAuth,
  async (req, res, next) => {
    try {
      const { projectId, issueId } = req.params;

      if (
        !projectId ||
        !SAFE_ID_REGEX.test(projectId) ||
        !issueId ||
        !SAFE_ID_REGEX.test(issueId)
      ) {
        return res.status(400).json({
          success: false,
          code: "INVALID_IDENTIFIER",
          error: "Valid project and issue identifiers required.",
        });
      }

      const existingIssue = await prisma.issue.findFirst({
        where: {
          id: issueId,
          projectId,
        },
      });

      if (!existingIssue) {
        return res.status(404).json({
          success: false,
          code: "ISSUE_NOT_FOUND",
          error: "Issue not found in this project.",
        });
      }

      await prisma.issue.delete({
        where: { id: issueId },
      });

      return res.status(200).json({
        success: true,
        message: "Issue deleted successfully.",
      });
    } catch (error) {
      next(error);
    }
  },
);

module.exports = { projectsRouter: router };
