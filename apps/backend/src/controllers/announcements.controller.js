const announcementsService = require("../services/announcements.service");
const { successResponse, errorResponse } = require("../utils/response");

async function listAnnouncements(req, res, next) {
  try {
    const { category, priority, status } = req.query;
    const announcements = await announcementsService.listAnnouncements({
      category,
      priority,
      status,
    });
    return successResponse(res, {
      data: announcements,
      message: "Announcements and notifications retrieved successfully",
    });
  } catch (err) {
    next(err);
  }
}

async function getAnnouncementById(req, res, next) {
  try {
    const { id } = req.params;
    const item = await announcementsService.getAnnouncementById(id);
    if (!item) {
      return errorResponse(res, {
        error: "Announcement not found",
        statusCode: 404,
        code: "NOT_FOUND",
        req,
      });
    }
    return successResponse(res, {
      data: item,
      message: "Announcement retrieved successfully",
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listAnnouncements,
  getAnnouncementById,
};
