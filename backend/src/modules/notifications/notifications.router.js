const router = require("express").Router();
const NotificationController = require("./notifications.controller");
const authenticateUser = require("../../middlewares/auth.middlewares");

router.get(
  "/notifications",
  authenticateUser,
  NotificationController.getMyNotifications,
);
router.patch(
  "/notifications/:id/read",
  authenticateUser,
  NotificationController.markNotificationAsRead,
);
router.get(
  "/notifications/unread-count",
  authenticateUser,
  NotificationController.getUnreadCount,
);
router.patch(
  "/notifications/mark-all-read",
  authenticateUser,
  NotificationController.markAllAsRead,
);
router.delete(
  "/notifications/:id/delete",
  authenticateUser,
  NotificationController.deleteNotification,
);
module.exports = router;
