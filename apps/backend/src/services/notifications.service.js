const { prisma } = require("../lib/prisma");
const { queues } = require("../lib/redis");

class NotificationError extends Error {
  constructor(message, statusCode = 400, code = "NOTIFICATION_ERROR") {
    super(message);
    this.name = "NotificationError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * List user notifications with unread count
 */
async function listNotifications({ userId, page = 1, limit = 20, unreadOnly = false }) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (safePage - 1) * safeLimit;

  const where = { userId };
  if (unreadOnly) {
    where.read = false;
  }

  const [total, unreadCount, notifications] = await prisma.$transaction([
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, read: false } }),
    prisma.notification.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}

/**
 * Mark a single notification as read
 */
async function markAsRead({ userId, notificationId }) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    throw new NotificationError("Notification not found.", 404, "NOT_FOUND");
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: {
      read: true,
      readAt: new Date(),
    },
  });
}

/**
 * Mark all notifications as read for current user
 */
async function markAllAsRead({ userId }) {
  const result = await prisma.notification.updateMany({
    where: { userId, read: false },
    data: {
      read: true,
      readAt: new Date(),
    },
  });

  return { count: result.count, message: "All notifications marked as read." };
}

/**
 * Delete a notification
 */
async function deleteNotification({ userId, notificationId }) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    throw new NotificationError("Notification not found.", 404, "NOT_FOUND");
  }

  await prisma.notification.delete({
    where: { id: notificationId },
  });

  return { message: "Notification deleted." };
}

/**
 * Internal helper to dispatch notification to user
 */
async function createNotification({
  userId,
  title,
  message,
  type = "info",
  link = null,
}) {
  return prisma.notification.create({
    data: {
      userId,
      title: String(title).slice(0, 150),
      message: String(message),
      type: type || "info",
      link: link || null,
    },
  });
}

/**
 * Enqueue notification into background BullMQ processing queue
 */
async function enqueueNotification(payload) {
  return queues.dispatch.dispatchNotification(payload);
}

// Register background BullMQ worker for asynchronous notification delivery
queues.registerWorker(queues.QUEUE_NAMES.NOTIFICATIONS, async (job) => {
  const { userId, title, message, type, link } = job.data;
  return createNotification({ userId, title, message, type, link });
});

module.exports = {
  listNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  enqueueNotification,
  NotificationError,
};
