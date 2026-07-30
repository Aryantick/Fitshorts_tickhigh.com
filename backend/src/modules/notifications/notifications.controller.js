const NotificationService = require("./notifications.service");
const apiResponse = require("../../utils/apiResponse");

async function getMyNotifications(req, res) {
  try {
    const userId = req.user.userId;
    const notifications = await NotificationService.getByNotifacition(userId);
    return apiResponse(
      res,
      200,
      "Notifications fetched successfully",
      notifications,
    );
  } catch (error) {
    return apiResponse(res, 400, error.message, error);
  }
}

async function markNotificationAsRead(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const result = await NotificationService.markNotificationAsRead(id, userId);
    return apiResponse(res, 200, "Notification marked as read", result);
  } catch (error) {
    return apiResponse(res, 400, error.message, error);
  }
}
async function getUnreadCount(req, res) {
  try {
    const userId = req.user.userId;
    const result = await NotificationService.getUnreadCount(userId);
    return apiResponse(res, 200, "Unread count fetched successfully", result);
  } catch (error) {
    return apiResponse(res, 400, error.message, error);
  }
}

async function markAllAsRead(req, res) {
  try {
    const userId = req.user.userId;
    const result = await NotificationService.markAllAsRead(userId);
    return apiResponse(res, 200, "All notifications marked as read", result);
  } catch (error) {
    return apiResponse(res, 400, error.message, error);
  }
}

async function deleteNotification(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const result = await NotificationService.deleteNotification(id, userId);
    return apiResponse(res, 200, "Notification deleted successfully", result);
  } catch (error) {
    return apiResponse(res, 400, error.message, error);
  }
}

module.exports = {
  getMyNotifications,
  markNotificationAsRead,
  getUnreadCount,
  markAllAsRead,
  deleteNotification,
};
