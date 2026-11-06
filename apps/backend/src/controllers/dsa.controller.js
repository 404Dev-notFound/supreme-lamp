const { dsaService } = require("../services/dsa.service");

class DsaController {
  async getAlgorithms(req, res, next) {
    try {
      const { category, difficulty, search, language } = req.query;
      const algorithms = dsaService.listAlgorithms({ category, difficulty, search, language });
      return res.status(200).json({
        success: true,
        count: algorithms.length,
        data: algorithms,
      });
    } catch (err) {
      next(err);
    }
  }

  async getAlgorithmBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      const algorithm = dsaService.getAlgorithmBySlug(slug);
      if (!algorithm) {
        return res.status(404).json({
          success: false,
          error: "Algorithm not found",
        });
      }
      return res.status(200).json({
        success: true,
        data: algorithm,
      });
    } catch (err) {
      next(err);
    }
  }

  async getCategories(req, res, next) {
    try {
      const categories = dsaService.getCategories();
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
      const languages = dsaService.getLanguages();
      return res.status(200).json({
        success: true,
        count: languages.length,
        data: languages,
      });
    } catch (err) {
      next(err);
    }
  }
}

const dsaController = new DsaController();

module.exports = { dsaController };
