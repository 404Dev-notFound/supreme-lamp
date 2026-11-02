const premiumResourcesService = require("../services/premiumResources.service");

class PremiumResourcesController {
  async getResources(req, res, next) {
    try {
      const { category, level, search } = req.query;
      const isPremium = Boolean(req.isPremium);

      const resources = await premiumResourcesService.listResources({
        isPremium,
        category,
        level,
        search,
      });

      res.setHeader("Cache-Control", isPremium ? "private, no-cache" : "public, max-age=30");
      return res.status(200).json({
        success: true,
        count: resources.length,
        isPremiumViewer: isPremium,
        resources,
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

