const dashboardService = require("../services/dashboard.service");
const { successResponse, errorResponse } = require("../utils/response");

/**
 * Controller for Centralized Authenticated Dashboard
 */
async function getAccountDashboard(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return errorResponse(res, 401, "UNAUTHORIZED", "Authentication required to view Mission Control dashboard.");
    }

    const data = await dashboardService.getAccountDashboard(userId);

    // Private authenticated dashboard data must never be cached by shared caches or proxies
    res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    return successResponse(res, {
      data,
      message: "Dashboard metrics retrieved successfully.",
      statusCode: 200,
    });
  } catch (err) {
    if (err.statusCode) {
      return errorResponse(res, err.statusCode, err.code, err.message);
    }
    return next(err);
  }
}

module.exports = {
  getAccountDashboard,
};

