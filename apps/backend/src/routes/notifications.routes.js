const { Router } = require("express");
const notificationsController = require("../controllers/notifications.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = Router();

// GET /api/notifications - List user's notifications
router.get("/", requireAuth, notificationsController.listNotifications);

// POST /api/notifications/mark-all-read - Mark all as read
router.post("/mark-all-read", requireAuth, notificationsController.markAllAsRead);

// PATCH /api/notifications/:id/read - Mark single notification as read
router.patch("/:id/read", requireAuth, notificationsController.markAsRead);

// DELETE /api/notifications/:id - Delete notification
router.delete("/:id", requireAuth, notificationsController.deleteNotification);

module.exports = { notificationsRouter: router };
