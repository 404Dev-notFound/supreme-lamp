const { prisma } = require("../lib/prisma");

class ProjectsService {
  canModifyProject(user, project) {
    if (!user || !project) return false;
    if (["ADMIN", "SUPER_ADMIN"].includes(user.role)) return true;
    if (project.ownerId === user.id) return true;
    if (
      project.members &&
      project.members.some(
        (m) =>
          m.userId === user.id && ["owner", "admin"].includes(m.projectRole),
      )
    ) {
      return true;
    }
    return false;
  }

  async listProjects({ category, difficulty, search } = {}) {
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

    return await prisma.project.findMany({
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
  }

  async getProjectById(id) {
    return await prisma.project.findUnique({
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
  }

  async createProject(userId, sanitizedData) {
    return await prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          title: sanitizedData.title,
          category: sanitizedData.category || "General",
          difficulty: sanitizedData.difficulty || "Intermediate",
          techStack: sanitizedData.techStack || [],
          image: sanitizedData.image || null,
          description: sanitizedData.description || "",
          githubUrl: sanitizedData.githubUrl || null,
          isPinned: sanitizedData.isPinned || false,
          isDemo: sanitizedData.isDemo || false,
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
  }

  async updateProject(id, user, updateData) {
    const existing = await prisma.project.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!existing) {
      const err = new Error("Project not found.");
      err.statusCode = 404;
      err.code = "PROJECT_NOT_FOUND";
      throw err;
    }

    if (!this.canModifyProject(user, existing)) {
      const err = new Error("You do not have permission to modify this project.");
      err.statusCode = 403;
      err.code = "FORBIDDEN";
      throw err;
    }

    return await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async deleteProject(id, user) {
    const existing = await prisma.project.findUnique({
      where: { id },
    });

    if (!existing) {
      const err = new Error("Project not found.");
      err.statusCode = 404;
      err.code = "PROJECT_NOT_FOUND";
      throw err;
    }

    const isOwner = existing.ownerId === user.id;
    const isPlatformAdmin = ["ADMIN", "SUPER_ADMIN"].includes(user.role);

    if (!isOwner && !isPlatformAdmin) {
      const err = new Error("Only the project owner or administrator can delete this project.");
      err.statusCode = 403;
      err.code = "FORBIDDEN";
      throw err;
    }

    await prisma.project.delete({
      where: { id },
    });

    return { success: true, message: "Project and associated records deleted successfully." };
  }

  async listProjectIssues(projectId) {
    return await prisma.issue.findMany({
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
  }

  async createProjectIssue(projectId, userId, issueData) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      const err = new Error("Project not found.");
      err.statusCode = 404;
      err.code = "PROJECT_NOT_FOUND";
      throw err;
    }

    let validAssigneeId = null;
    if (issueData.assigneeId) {
      const assigneeUser = await prisma.user.findUnique({
        where: { id: issueData.assigneeId },
        select: { id: true },
      });
      if (assigneeUser) {
        validAssigneeId = assigneeUser.id;
      }
    }

    return await prisma.issue.create({
      data: {
        title: issueData.title,
        description: issueData.description || "",
        status: issueData.status || "TODO",
        priority: issueData.priority || "MEDIUM",
        tags: issueData.tags || [],
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
  }

  async updateProjectIssue(projectId, issueId, updateData) {
    const existingIssue = await prisma.issue.findFirst({
      where: {
        id: issueId,
        projectId,
      },
    });

    if (!existingIssue) {
      const err = new Error("Issue not found in this project.");
      err.statusCode = 404;
      err.code = "ISSUE_NOT_FOUND";
      throw err;
    }

    const payload = { ...updateData };

    if (payload.assigneeId !== undefined) {
      if (payload.assigneeId === null || payload.assigneeId === "") {
        payload.assigneeId = null;
      } else {
        const assigneeExists = await prisma.user.findUnique({
          where: { id: payload.assigneeId },
          select: { id: true },
        });
        payload.assigneeId = assigneeExists ? assigneeExists.id : null;
      }
    }

    return await prisma.issue.update({
      where: { id: issueId },
      data: payload,
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async deleteProjectIssue(projectId, issueId) {
    const existingIssue = await prisma.issue.findFirst({
      where: {
        id: issueId,
        projectId,
      },
    });

    if (!existingIssue) {
      const err = new Error("Issue not found in this project.");
      err.statusCode = 404;
      err.code = "ISSUE_NOT_FOUND";
      throw err;
    }

    await prisma.issue.delete({
      where: { id: issueId },
    });

    return { success: true, message: "Issue deleted successfully." };
  }
}

module.exports = new ProjectsService();

