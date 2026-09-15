const NotifactionRep = require("./notifications.repository");

async function createNotification(userId, reelId, type, message, clientId = 1) {
  try {
    const result = await NotifactionRep.createNotification(
      userId,
      reelId,
      type,
      message,
      clientId,
    );
    return result;
  } catch (error) {
    console.log("createNotification error", error.message);
    throw error;
  }
}

async function getByNotifacition(userId, clientId = 1) {
  try {
    const notifaction = await NotifactionRep.findNotificationsByUserId(userId, clientId);
    return notifaction;
  } catch (error) {
    console.error("getMyNotifications error:", error.message);
    throw error;
  }
}

async function markNotificationAsRead(notificationId, userId, clientId = 1) {
  try {
    const result = await NotifactionRep.markAsRead(notificationId, userId, clientId);
    if (result.affectedRows === 0) {
      throw new Error("Notification not found or you are not authorized to update it");
    }
    return result;
  } catch (error) {
    console.error("markbynotifaction error", error.message);
    throw error;
  }
}

async function getUnreadCount(userId, clientId = 1) {
  try {
    const count = await NotifactionRep.getUnreadCount(userId, clientId);
    return { count };
  } catch (error) {
    console.error("getUnreadCount error:", error.message);
    throw error;
  }
}

async function markAllAsRead(userId, clientId = 1) {
  try {
    const result = await NotifactionRep.markAllAsRead(userId, clientId);
    return result;
  } catch (error) {
    console.error("markAllAsRead error:", error.message);
    throw error;
  }
}

async function deleteNotification(notificationId, userId, clientId = 1) {
  try {
    const result = await NotifactionRep.deleteNotification(
      notificationId,
      userId,
      clientId,
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
  getByNotification: getByNotifacition,
  markNotificationAsRead,
  getUnreadCount,
  markAllAsRead,
  deleteNotification,
};

