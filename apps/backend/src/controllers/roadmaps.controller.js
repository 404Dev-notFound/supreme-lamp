const roadmapsService = require("../services/roadmaps.service");
const {
  validateSlug,
  validateTopicId,
  sanitizeSearchQuery,
  sanitizeFilterValue,
} = require("../validators/roadmaps.validator");

class RoadmapsController {
  async getRoadmaps(req, res, next) {
    try {
      const { search, category, level } = req.query;

      const safeSearch = sanitizeSearchQuery(search);
      const cleanCategory = sanitizeFilterValue(category);
      const cleanLevel = sanitizeFilterValue(level);
      const isPremium = Boolean(req.isPremium);

      const results = await roadmapsService.getAllRoadmaps({
        search: safeSearch,
        category: cleanCategory,
        level: cleanLevel,
        isPremium,
      });

      res.setHeader("Cache-Control", isPremium ? "private, no-cache" : "public, max-age=60, s-maxage=300");
      return res.status(200).json({
        success: true,
        count: results.length,
        isPremiumViewer: isPremium,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRoadmapBySlug(req, res, next) {
    try {
      const valid = validateSlug(req.params.slug);
      if (!valid.isValid) {
        return res.status(400).json({
          success: false,
          code: "INVALID_IDENTIFIER",
          error: valid.error,
        });
      }

      const isPremium = Boolean(req.isPremium);
      const roadmap = await roadmapsService.getRoadmapBySlug(valid.slug, { isPremium });
      if (!roadmap) {
        return res.status(404).json({
          success: false,
          code: "ROADMAP_NOT_FOUND",
          error: `Roadmap track '${valid.slug}' was not found.`,
        });
      }

      res.setHeader("Cache-Control", isPremium ? "private, no-cache" : "public, max-age=60, s-maxage=300");
      return res.status(200).json({
        success: true,
        isPremiumViewer: isPremium,
        data: roadmap,
      });
    } catch (error) {
      next(error);
    }
  }

  getTopicDetail(req, res, next) {
    try {
      const validSlug = validateSlug(req.params.slug);
      if (!validSlug.isValid) {
        return res.status(400).json({
          success: false,
          code: "INVALID_IDENTIFIER",
          error: "Roadmap identifier contains invalid characters.",
        });
      }

      const validTopic = validateTopicId(req.params.topicId);
      if (!validTopic.isValid) {
        return res.status(400).json({
          success: false,
          code: "INVALID_IDENTIFIER",
          error: validTopic.error,
        });
      }

      const topic = roadmapsService.getTopicDetail(
        validSlug.slug,
        validTopic.topicId,
      );
      if (!topic) {
        return res.status(404).json({
          success: false,
          code: "TOPIC_NOT_FOUND",
          error: `Topic '${validTopic.topicId}' was not found in roadmap '${validSlug.slug}'.`,
        });
      }

      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300");
      return res.status(200).json({
        success: true,
        data: topic,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RoadmapsController();

