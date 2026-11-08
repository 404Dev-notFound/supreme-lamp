const premiumResourcesService = require("../services/premiumResources.service");

class PremiumResourcesController {
  async getResources(req, res, next) {
    try {
      const { category, level, search, page, limit } = req.query;
      const isPremium = Boolean(req.isPremium);

      const result = await premiumResourcesService.listResources({
        isPremium,
        category,
        level,
        search,
        page,
        limit,
      });

      res.setHeader("Cache-Control", isPremium ? "private, no-cache" : "public, max-age=30");

      if (result && Array.isArray(result)) {
        return res.status(200).json({
          success: true,
          count: result.length,
          total: result.length,
          isPremiumViewer: isPremium,
          resources: result,
        });
      }

      return res.status(200).json({
        success: true,
        count: result.resources.length,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        limit: result.limit,
        isPremiumViewer: isPremium,
        resources: result.resources,
      });
    } catch (err) {
      next(err);
    }
  }

  async getResourceBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      const isPremium = Boolean(req.isPremium);

      const resource = await premiumResourcesService.getResourceBySlug(slug, {
        isPremium,
      });

      res.setHeader("Cache-Control", isPremium ? "private, no-cache" : "public, max-age=30");
      return res.status(200).json({
        success: true,
        isPremiumViewer: isPremium,
        resource,
      });
    } catch (err) {
      next(err);
    }
  }

  async getCategories(req, res, next) {
    try {
      const categories = await premiumResourcesService.getResourceCategories();
      res.setHeader("Cache-Control", "public, max-age=300");
      return res.status(200).json({
        success: true,
        categories,
      });
    } catch (err) {
      next(err);
    }
  }

  async getMyBookmarks(req, res, next) {
    try {
      const userId = req.user.id;
      const { prisma } = require("../lib/prisma");
      const bookmarks = await prisma.resourceBookmark.findMany({
        where: { userId },
        include: {
          resource: {
            select: {
              id: true,
              slug: true,
              title: true,
              badge: true,
              accessLevel: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return res.status(200).json({
        success: true,
        count: bookmarks.length,
        data: bookmarks.map((b) => ({
          id: b.id,
          resourceId: b.resourceId,
          slug: b.resource.slug,
          title: b.resource.title,
          badge: b.resource.badge,
          accessLevel: b.resource.accessLevel,
          bookmarkedAt: b.createdAt,
        })),
      });
    } catch (err) {
      next(err);
    }
  }

  async toggleBookmark(req, res, next) {
    try {
      const userId = req.user.id;
      const { slug } = req.params;
      const { prisma } = require("../lib/prisma");
      const { analyticsService } = require("../services/analytics.service");

      const resource = await prisma.premiumResource.findFirst({
        where: { OR: [{ slug }, { id: slug }] },
        select: { id: true, slug: true, title: true },
      });

      if (!resource) {
        return res
          .status(404)
          .json({ success: false, error: "Resource not found" });
      }

      const existing = await prisma.resourceBookmark.findUnique({
        where: {
          userId_resourceId: {
            userId,
            resourceId: resource.id,
          },
        },
      });

      let isBookmarked = false;
      if (existing) {
        await prisma.resourceBookmark.delete({
          where: { id: existing.id },
        });
        isBookmarked = false;
      } else {
        await prisma.resourceBookmark.create({
          data: {
            userId,
            resourceId: resource.id,
          },
        });
        isBookmarked = true;

        await analyticsService.recordEvent({
          userId,
          eventType: "BOOKMARK",
          entityType: "RESOURCE",
          entityId: resource.slug,
        });
      }

      const totalBookmarks = await prisma.resourceBookmark.count({
        where: { userId },
      });

      return res.status(200).json({
        success: true,
        data: {
          resourceId: resource.id,
          slug: resource.slug,
          isBookmarked,
          totalUserBookmarks: totalBookmarks,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PremiumResourcesController();

