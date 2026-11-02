const notificationsService = require("../services/notifications.service");
const { successResponse } = require("../utils/response");

async function listNotifications(req, res, next) {
  try {
    const { page, limit, unreadOnly } = req.query;
    const result = await notificationsService.listNotifications({
      userId: req.user.id,
      page,
      limit,
      unreadOnly: unreadOnly === "true",
    });
    return successResponse(res, {
      data: result.notifications,
      meta: {
        ...result.pagination,
        unreadCount: result.unreadCount,
      },
      req,
    });
  } catch (err) {
    next(err);
  }
}

async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;
    const updated = await notificationsService.markAsRead({
      userId: req.user.id,
      notificationId: id,
    });
    return successResponse(res, { data: updated, req });
  } catch (err) {
    next(err);
  }
}

async function markAllAsRead(req, res, next) {
  try {
    const result = await notificationsService.markAllAsRead({
      userId: req.user.id,
    });
    return successResponse(res, { message: result.message, req });
  } catch (err) {
    next(err);
  }
}

async function deleteNotification(req, res, next) {
  try {
    const { id } = req.params;
    const result = await notificationsService.deleteNotification({
      userId: req.user.id,
      notificationId: id,
    });
    return successResponse(res, { message: result.message, req });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
