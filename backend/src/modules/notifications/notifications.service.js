const NotifactionRep = require("./notifications.repository");

async function createNotification(userId, reelId, type, message) {
  try {
    const result = await NotifactionRep.createNotification(
      userId,
      reelId,
      type,
      message,
    );
    return result;
  } catch (error) {
    console.log("createNotification error", error.message);
    throw error;
  }
}

async function getByNotifacition(userId) {
  try {
    const notifaction = await NotifactionRep.findNotificationsByUserId(userId);
    return notifaction;
  } catch (error) {
    console.error("getMyNotifications error:", error.message);
    throw error;
  }
}

async function markNotificationAsRead(notifactionid) {
  try {
    const result = await NotifactionRep.markAsRead(notifactionid);
    return result;
  } catch (error) {
    console.error("markbynotifaction error", error.message);
    throw error;
  }
}

async function getUnreadCount(userId) {
  try {
    const count = await NotifactionRep.getUnreadCount(userId);
    return { count };
  } catch (error) {
    console.error("getUnreadCount error:", error.message);
    throw error;
  }
}

async function markAllAsRead(userId) {
  try {
    const result = await NotifactionRep.markAllAsRead(userId);
    return result;
  } catch (error) {
    console.error("markAllAsRead error:", error.message);
    throw error;
  }
}

async function deleteNotification(notificationId, userId) {
  try {
    const result = await NotifactionRep.deleteNotification(
      notificationId,
      userId,
    );
    if (result.affectedRows === 0) {
      throw new Error(
        "Notification not found or you are not authorized to delete it",
      );
    }
    return result;
  } catch (error) {
    console.error("deleteNotification error:", error.message);
    throw error;
  }
}

module.exports = {
  createNotification,
  getByNotifacition,
  markNotificationAsRead,
  getUnreadCount,
  markAllAsRead,
  deleteNotification,
};