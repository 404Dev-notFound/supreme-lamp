const { analyticsService } = require("../services/analytics.service");
const { successResponse, errorResponse } = require("../utils/response");

class AnalyticsController {
  /**
   * Track event endpoint (public or authenticated)
   * POST /api/analytics/events
   */
  async trackEvent(req, res, next) {
    try {
      const { eventType, entityType, entityId, metadata } = req.body || {};
      const resolvedVisitorId = req.user?.id ? null : "without_signin";

      const ipAddress =
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.socket?.remoteAddress ||
        "127.0.0.1";
      const userAgent = req.headers["user-agent"] || "unknown";

      const result = await analyticsService.recordEvent({
        userId: req.user?.id || null,
        visitorId: resolvedVisitorId,
        eventType,
        entityType,
        entityId,
        metadata,
        ipAddress,
        userAgent,
      });

      return successResponse(res, {
        data: result,
        statusCode: 200,
        req,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Public roadmap analytics endpoint
   * GET /api/analytics/roadmaps/:slug
   */
  async getRoadmapAnalytics(req, res, next) {
    try {
      const { slug } = req.params;
      const stats = await analyticsService.getEntityAnalytics({
        entityType: "ROADMAP",
        entityId: slug,
      });

      return successResponse(res, {
        data: stats,
        statusCode: 200,
        req,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin platform overview endpoint
   * GET /api/analytics/platform
   */
  async getPlatformOverview(req, res, next) {
    try {
      if (req.user?.role !== "ADMIN") {
        return errorResponse(
          res,
          "Forbidden: Administrator privileges required.",
          403,
          "FORBIDDEN",
          req,
        );
      }

      const overview = await analyticsService.getPlatformOverview(req.user.role, {
        eventPage: req.query.page,
        eventLimit: req.query.limit,
      });
      return successResponse(res, {
        data: overview,
        statusCode: 200,
        req,
      });
    } catch (err) {
      next(err);
    }
  }
}

const analyticsController = new AnalyticsController();
module.exports = { analyticsController };

