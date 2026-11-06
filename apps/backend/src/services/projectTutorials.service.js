const crypto = require("crypto");
const { prisma } = require("../lib/prisma");
const { cache, buildKey, REDIS_CONFIG } = require("../lib/redis");

/**
 * Service handling Project-Building Tutorials business logic,
 * database persistence, and resilient Redis caching.
 */

class ProjectTutorialsService {
  /**
   * Helper to hash query parameters for deterministic Redis cache keys
   */
  _hashParams(params) {
    const serialized = JSON.stringify(params, Object.keys(params).sort());
    return crypto.createHash("sha256").update(serialized).digest("hex").slice(0, 16);
  }

  /**
   * List project tutorials with multi-attribute filtering, search, and pagination.
   * Public results are cached in Redis; authenticated user progress is merged dynamically.
   */
  async listProjects(
    {
      search,
      category,
      language,
      difficulty,
      page = 1,
      limit = 12,
      sort = "recommended",
    } = {},
    currentUserId = null
  ) {
    const filterHash = this._hashParams({ search, category, language, difficulty, page, limit, sort });
    const cacheKey = buildKey(REDIS_CONFIG.namespaces.PROJECT_TUTORIALS, "list", filterHash);

    // 1. Fetch public catalog results (leveraging stampede-proof Redis cache)
    const publicCatalog = await cache.getOrSet(
      cacheKey,
      async () => {
        const where = { isPublished: true };

        // Category filter
        if (category && category !== "all") {
          where.categorySlug = category;
        }

        // Language filter
        if (language && language !== "all") {
          where.languages = { has: language };
        }

        // Difficulty filter
        if (difficulty && difficulty !== "all") {
          where.difficulty = { equals: difficulty, mode: "insensitive" };
        }

        // Keyword & Full-Text Search
        if (search && search.trim()) {
          const q = search.trim();
          where.OR = [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { whatYouWillBuild: { contains: q, mode: "insensitive" } },
            { technologies: { has: q } },
            { learningOutcomes: { hasSome: [q] } },
          ];
        }

        // Sort ordering
        let orderBy;
        switch (sort) {
          case "newest":
            orderBy = [{ createdAt: "desc" }];
            break;
          case "difficulty_asc":
            orderBy = [{ difficulty: "asc" }, { sortOrder: "asc" }];
            break;
          case "difficulty_desc":
            orderBy = [{ difficulty: "desc" }, { sortOrder: "asc" }];
            break;
          case "duration_asc":
            orderBy = [{ estimatedHours: "asc" }];
            break;
          case "duration_desc":
            orderBy = [{ estimatedHours: "desc" }];
            break;
          case "recommended":
          default:
            orderBy = [
              { isFeatured: "desc" },
              { sortOrder: "asc" },
              { createdAt: "desc" },
            ];
            break;
        }

        const skip = (page - 1) * limit;

        const [totalCount, items] = await Promise.all([
          prisma.projectTutorial.count({ where }),
          prisma.projectTutorial.findMany({
            where,
            orderBy,
            skip,
            take: limit,
            select: {
              id: true,
              slug: true,
              title: true,
              description: true,
              categorySlug: true,
              language: true,
              languages: true,
              difficulty: true,
              estimatedHours: true,
              whatYouWillBuild: true,
              technologies: true,
              sourceAuthor: true,
              isFeatured: true,
              projectType: true,
              tutorialUrl: true,
              githubUrl: true,
              sourceRepositories: true,
              category: {
                select: {
                  name: true,
                  slug: true,
                  icon: true,
                },
              },
              _count: {
                select: {
                  steps: true,
                  resources: true,
                },
              },
            },
          }),
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        return {
          items: items.map((t) => ({
            id: t.id,
            slug: t.slug,
            title: t.title,
            description: t.description,
            categorySlug: t.categorySlug,
            categoryName: t.category?.name || t.categorySlug,
            categoryIcon: t.category?.icon || "FolderGit2",
            language: t.language,
            languages: t.languages,
            difficulty: t.difficulty,
            estimatedHours: t.estimatedHours,
            whatYouWillBuild: t.whatYouWillBuild,
            technologies: t.technologies,
            sourceAuthor: t.sourceAuthor,
            isFeatured: t.isFeatured,
            projectType: t.projectType,
            tutorialUrl: t.tutorialUrl,
            githubUrl: t.githubUrl,
            sourceRepositories: t.sourceRepositories,
            totalSteps: t._count.steps,
            totalResources: t._count.resources,
          })),
          pagination: {
            total: totalCount,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
        };
      },
      REDIS_CONFIG.ttl.PROJECT_TUTORIALS_CATALOG
    );

    // 2. If authenticated, dynamically augment items with user's private progress and bookmark status
    if (currentUserId && publicCatalog?.items?.length > 0) {
      const projectIds = publicCatalog.items.map((i) => i.id);

      const [userProgressList, userBookmarks] = await Promise.all([
        prisma.userProjectProgress.findMany({
          where: {
            userId: currentUserId,
            projectTutorialId: { in: projectIds },
          },
          select: {
            projectTutorialId: true,
            status: true,
            currentStepNumber: true,
            completedStepCount: true,
            totalStepCount: true,
            progressPercent: true,
            lastActivityAt: true,
          },
        }),
        prisma.projectBookmark.findMany({
          where: {
            userId: currentUserId,
            projectTutorialId: { in: projectIds },
          },
          select: {
            projectTutorialId: true,
          },
        }),
      ]);

      const progressMap = new Map(userProgressList.map((p) => [p.projectTutorialId, p]));
      const bookmarkSet = new Set(userBookmarks.map((b) => b.projectTutorialId));

      const personalizedItems = publicCatalog.items.map((item) => {
        const prog = progressMap.get(item.id);
        return {
          ...item,
          userProgress: prog
            ? {
                status: prog.status,
                currentStepNumber: prog.currentStepNumber,
                completedStepCount: prog.completedStepCount,
                totalStepCount: prog.totalStepCount || item.totalSteps,
                progressPercent: prog.progressPercent,
                lastActivityAt: prog.lastActivityAt,
              }
            : null,
          isBookmarked: bookmarkSet.has(item.id),
        };
      });

      return {
        ...publicCatalog,
        items: personalizedItems,
      };
    }

    return publicCatalog;
  }

  /**
   * Get all active categories with project counts
   */
  async getCategories() {
    const cacheKey = buildKey(REDIS_CONFIG.namespaces.PROJECT_TUTORIALS, "categories");

    return cache.getOrSet(
      cacheKey,
      async () => {
        const categories = await prisma.projectTutorialCategory.findMany({
          orderBy: { sortOrder: "asc" },
          include: {
            _count: {
              select: {
                tutorials: {
                  where: { isPublished: true },
                },
              },
            },
          },
        });

        return categories.map((c) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          description: c.description,
          icon: c.icon,
          projectCount: c._count.tutorials,
        }));
      },
      REDIS_CONFIG.ttl.STATIC_METADATA
    );
  }

  /**
   * Get all available programming languages
   */
  async getLanguages() {
    const cacheKey = buildKey(REDIS_CONFIG.namespaces.PROJECT_TUTORIALS, "languages");

    return cache.getOrSet(
      cacheKey,
      async () => {
        const tutorials = await prisma.projectTutorial.findMany({
          where: { isPublished: true },
          select: { languages: true },
        });

        const langSet = new Set();
        tutorials.forEach((t) => {
          (t.languages || []).forEach((l) => langSet.add(l));
        });

        return Array.from(langSet).sort();
      },
      REDIS_CONFIG.ttl.STATIC_METADATA
    );
  }

  /**
   * Get complete project tutorial detail by slug.
   * Public data is cached in Redis; user-specific progress is queried directly from PostgreSQL.
   */
  async getProjectBySlug(slug, currentUserId = null) {
    if (!slug) return null;

    const cacheKey = buildKey(REDIS_CONFIG.namespaces.PROJECT_TUTORIALS, "detail", slug);

    const publicTutorial = await cache.getOrSet(
      cacheKey,
      async () => {
        const tutorial = await prisma.projectTutorial.findUnique({
          where: { slug },
          include: {
            category: {
              select: {
                name: true,
                slug: true,
                icon: true,
              },
            },
            resources: {
              where: { isVerified: true },
              orderBy: { sortOrder: "asc" },
            },
            steps: {
              orderBy: { stepNumber: "asc" },
            },
          },
        });

        return tutorial;
      },
      REDIS_CONFIG.ttl.PROJECT_TUTORIALS_DETAIL
    );

    if (!publicTutorial) {
      return null;
    }

    // Attach user progress and bookmark state if authenticated
    let userProgress = null;
    let isBookmarked = false;

    if (currentUserId) {
      const [progressRecord, bookmarkRecord] = await Promise.all([
        prisma.userProjectProgress.findUnique({
          where: {
            userId_projectTutorialId: {
              userId: currentUserId,
              projectTutorialId: publicTutorial.id,
            },
          },
          include: {
            stepProgress: {
              select: {
                projectStepId: true,
                isCompleted: true,
                completedAt: true,
                notes: true,
              },
            },
          },
        }),
        prisma.projectBookmark.findUnique({
          where: {
            userId_projectTutorialId: {
              userId: currentUserId,
              projectTutorialId: publicTutorial.id,
            },
          },
        }),
      ]);

      if (progressRecord) {
        const completedStepIdSet = new Set(
          progressRecord.stepProgress.filter((sp) => sp.isCompleted).map((sp) => sp.projectStepId)
        );

        userProgress = {
          id: progressRecord.id,
          status: progressRecord.status,
          currentStepNumber: progressRecord.currentStepNumber,
          completedStepCount: progressRecord.completedStepCount,
          totalStepCount: progressRecord.totalStepCount || publicTutorial.steps.length,
          progressPercent: progressRecord.progressPercent,
          startedAt: progressRecord.startedAt,
          completedAt: progressRecord.completedAt,
          lastActivityAt: progressRecord.lastActivityAt,
          completedStepIds: Array.from(completedStepIdSet),
        };
      }

      isBookmarked = Boolean(bookmarkRecord);
    }

    return {
      ...publicTutorial,
      userProgress,
      isBookmarked,
    };
  }

  /**
   * Start or initialize user progress on a project tutorial
   */
  async startProject(userId, projectTutorialId) {
    const project = await prisma.projectTutorial.findUnique({
      where: { id: projectTutorialId },
      include: {
        _count: { select: { steps: true } },
      },
    });

    if (!project) {
      throw new Error("Project tutorial not found");
    }

    const totalSteps = project._count.steps;

    const progress = await prisma.userProjectProgress.upsert({
      where: {
        userId_projectTutorialId: {
          userId,
          projectTutorialId,
        },
      },
      update: {
        status: "IN_PROGRESS",
        totalStepCount: totalSteps,
        lastActivityAt: new Date(),
      },
      create: {
        userId,
        projectTutorialId,
        status: "IN_PROGRESS",
        currentStepNumber: 1,
        completedStepCount: 0,
        totalStepCount: totalSteps,
        progressPercent: 0,
        startedAt: new Date(),
        lastActivityAt: new Date(),
      },
    });

    return progress;
  }

  /**
   * Mark an individual step as completed or incomplete.
   * Recalculates total progress percent atomically.
   */
  async updateStepProgress(userId, projectTutorialId, stepNumber, isCompleted, notes = null) {
    const project = await prisma.projectTutorial.findUnique({
      where: { id: projectTutorialId },
      include: {
        steps: { orderBy: { stepNumber: "asc" } },
      },
    });

    if (!project) {
      throw new Error("Project tutorial not found");
    }

    const targetStep = project.steps.find((s) => s.stepNumber === stepNumber);
    if (!targetStep) {
      throw new Error(`Step number ${stepNumber} does not exist in this tutorial`);
    }

    // Ensure parent UserProjectProgress exists
    let userProgress = await prisma.userProjectProgress.findUnique({
      where: {
        userId_projectTutorialId: {
          userId,
          projectTutorialId,
        },
      },
    });

    if (!userProgress) {
      userProgress = await prisma.userProjectProgress.create({
        data: {
          userId,
          projectTutorialId,
          status: "IN_PROGRESS",
          currentStepNumber: stepNumber,
          totalStepCount: project.steps.length,
          progressPercent: 0,
          startedAt: new Date(),
          lastActivityAt: new Date(),
        },
      });
    }

    // Upsert individual step progress
    await prisma.userProjectStepProgress.upsert({
      where: {
        userProgressId_projectStepId: {
          userProgressId: userProgress.id,
          projectStepId: targetStep.id,
        },
      },
      update: {
        isCompleted: Boolean(isCompleted),
        completedAt: isCompleted ? new Date() : null,
        notes: notes !== undefined ? notes : undefined,
        updatedAt: new Date(),
      },
      create: {
        userProgressId: userProgress.id,
        projectStepId: targetStep.id,
        isCompleted: Boolean(isCompleted),
        completedAt: isCompleted ? new Date() : null,
        notes,
      },
    });

    // Count completed steps
    const completedCount = await prisma.userProjectStepProgress.count({
      where: {
        userProgressId: userProgress.id,
        isCompleted: true,
      },
    });

    const totalSteps = project.steps.length;
    const progressPercent = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;
    const isProjectComplete = progressPercent === 100;

    const nextStepNumber = isCompleted && stepNumber < totalSteps ? stepNumber + 1 : stepNumber;

    const updatedProgress = await prisma.userProjectProgress.update({
      where: { id: userProgress.id },
      data: {
        completedStepCount: completedCount,
        totalStepCount: totalSteps,
        progressPercent,
        currentStepNumber: nextStepNumber,
        status: isProjectComplete ? "COMPLETED" : "IN_PROGRESS",
        completedAt: isProjectComplete ? new Date() : null,
        lastActivityAt: new Date(),
      },
      include: {
        stepProgress: {
          select: {
            projectStepId: true,
            isCompleted: true,
            completedAt: true,
          },
        },
      },
    });

    return updatedProgress;
  }

  /**
   * Mark entire project as completed
   */
  async completeProject(userId, projectTutorialId) {
    const project = await prisma.projectTutorial.findUnique({
      where: { id: projectTutorialId },
      include: { steps: true },
    });

    if (!project) {
      throw new Error("Project tutorial not found");
    }

    let userProgress = await prisma.userProjectProgress.findUnique({
      where: {
        userId_projectTutorialId: {
          userId,
          projectTutorialId,
        },
      },
    });

    if (!userProgress) {
      userProgress = await prisma.userProjectProgress.create({
        data: {
          userId,
          projectTutorialId,
          totalStepCount: project.steps.length,
          startedAt: new Date(),
        },
      });
    }

    // Mark all steps completed
    for (const step of project.steps) {
      await prisma.userProjectStepProgress.upsert({
        where: {
          userProgressId_projectStepId: {
            userProgressId: userProgress.id,
            projectStepId: step.id,
          },
        },
        update: {
          isCompleted: true,
          completedAt: new Date(),
        },
        create: {
          userProgressId: userProgress.id,
          projectStepId: step.id,
          isCompleted: true,
          completedAt: new Date(),
        },
      });
    }

    const updated = await prisma.userProjectProgress.update({
      where: { id: userProgress.id },
      data: {
        status: "COMPLETED",
        completedStepCount: project.steps.length,
        totalStepCount: project.steps.length,
        progressPercent: 100,
        completedAt: new Date(),
        lastActivityAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Get all active and completed projects for a specific user
   */
  async getUserProgressList(userId) {
    const progressList = await prisma.userProjectProgress.findMany({
      where: { userId },
      orderBy: { lastActivityAt: "desc" },
      include: {
        project: {
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            categorySlug: true,
            language: true,
            difficulty: true,
            estimatedHours: true,
            category: {
              select: {
                name: true,
                icon: true,
              },
            },
          },
        },
      },
    });

    return progressList.map((p) => ({
      id: p.id,
      projectTutorialId: p.projectTutorialId,
      status: p.status,
      currentStepNumber: p.currentStepNumber,
      completedStepCount: p.completedStepCount,
      totalStepCount: p.totalStepCount,
      progressPercent: p.progressPercent,
      startedAt: p.startedAt,
      completedAt: p.completedAt,
      lastActivityAt: p.lastActivityAt,
      project: {
        id: p.project.id,
        slug: p.project.slug,
        title: p.project.title,
        description: p.project.description,
        categorySlug: p.project.categorySlug,
        categoryName: p.project.category?.name || p.project.categorySlug,
        categoryIcon: p.project.category?.icon || "FolderGit2",
        language: p.project.language,
        difficulty: p.project.difficulty,
        estimatedHours: p.project.estimatedHours,
      },
    }));
  }

  /**
   * Toggle bookmark for user on a project tutorial
   */
  async toggleBookmark(userId, projectTutorialId) {
    const existing = await prisma.projectBookmark.findUnique({
      where: {
        userId_projectTutorialId: {
          userId,
          projectTutorialId,
        },
      },
    });

    if (existing) {
      await prisma.projectBookmark.delete({
        where: { id: existing.id },
      });
      return { bookmarked: false };
    }

    await prisma.projectBookmark.create({
      data: {
        userId,
        projectTutorialId,
      },
    });
    return { bookmarked: true };
  }

  /**
   * Get user's bookmarked projects
   */
  async getUserBookmarks(userId) {
    const bookmarks = await prisma.projectBookmark.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        project: {
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            categorySlug: true,
            language: true,
            difficulty: true,
            estimatedHours: true,
            technologies: true,
            category: {
              select: {
                name: true,
                icon: true,
              },
            },
            _count: {
              select: { steps: true },
            },
          },
        },
      },
    });

    return bookmarks.map((b) => ({
      id: b.id,
      createdAt: b.createdAt,
      project: {
        ...b.project,
        totalSteps: b.project._count.steps,
      },
    }));
  }

  /**
   * Invalidate Redis catalog cache after administrative content updates
   */
  async invalidateCatalogCache() {
    await cache.delPattern(buildKey(REDIS_CONFIG.namespaces.PROJECT_TUTORIALS, "*"));
  }
}

const projectTutorialsService = new ProjectTutorialsService();

module.exports = {
  projectTutorialsService,
  ProjectTutorialsService,
};

