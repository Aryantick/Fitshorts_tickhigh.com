const NotificationService = require("./notifications.service");
const apiResponse = require("../../utils/apiResponse");

async function getMyNotifications(req, res) {
  try {
    const userId = req.user.userId;
    const clientId = req.client?.id || req.user?.clientId || 1;
    const notifications = await NotificationService.getByNotifacition(userId, clientId);
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
    const clientId = req.client?.id || req.user?.clientId || 1;
    const result = await NotificationService.markNotificationAsRead(id, userId, clientId);
    return apiResponse(res, 200, "Notification marked as read", result);
  } catch (error) {
    return apiResponse(res, 400, error.message, error);
  }
}

async function getUnreadCount(req, res) {
  try {
    const userId = req.user.userId;
    const clientId = req.client?.id || req.user?.clientId || 1;
    const result = await NotificationService.getUnreadCount(userId, clientId);
    return apiResponse(res, 200, "Unread count fetched successfully", result);
  } catch (error) {
    return apiResponse(res, 400, error.message, error);
  }
}

async function markAllAsRead(req, res) {
  try {
    const userId = req.user.userId;
    const clientId = req.client?.id || req.user?.clientId || 1;
    const result = await NotificationService.markAllAsRead(userId, clientId);
    return apiResponse(res, 200, "All notifications marked as read", result);
  } catch (error) {
    return apiResponse(res, 400, error.message, error);
  }
}

async function deleteNotification(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const clientId = req.client?.id || req.user?.clientId || 1;
    const result = await NotificationService.deleteNotification(id, userId, clientId);
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

