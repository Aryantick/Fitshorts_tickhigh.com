const pool = require("../../config/db.config");

async function createNotification(userId, reelId, type, message, clientId = 1) {
  const [result] = await pool.query(
    "INSERT INTO notifications (user_id, reel_id, type, message, client_id) VALUES (?, ?, ?, ?, ?)",
    [userId, reelId, type, message, clientId],
  );
  return result;
}

async function findNotificationsByUserId(userId, clientId = 1) {
  const [rows] = await pool.query(
    "SELECT * FROM notifications WHERE user_id = ? AND (client_id = ? OR client_id IS NULL) ORDER BY created_at DESC",
    [userId, clientId],
  );
  return rows;
}

async function markAsRead(notificationId, userId, clientId = 1) {
  const [result] = await pool.query(
    "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ? AND (client_id = ? OR client_id IS NULL)",
    [notificationId, userId, clientId],
  );
  return result;
}

async function getUnreadCount(userId, clientId = 1) {
  const [rows] = await pool.query(
    "SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0 AND (client_id = ? OR client_id IS NULL)",
    [userId, clientId],
  );
  return rows[0] ? rows[0].count : 0;
}

async function markAllAsRead(userId, clientId = 1) {
  const [result] = await pool.query(
    "UPDATE notifications SET is_read = 1 WHERE user_id = ? AND (client_id = ? OR client_id IS NULL)",
    [userId, clientId],
  );
  return result;
}

async function deleteNotification(notificationId, userId, clientId = 1) {
  const [result] = await pool.query(
    "DELETE FROM notifications WHERE id = ? AND user_id = ? AND (client_id = ? OR client_id IS NULL)",
    [notificationId, userId, clientId],
  );
  return result;
}

module.exports = {
  getUnreadCount,
  markAllAsRead,
  deleteNotification,
  createNotification,
  markAsRead,
  findNotificationsByUserId,
};

