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
}

module.exports = new PremiumResourcesController();

