const pool = require("../../config/db.config");

async function createNotification(userId, ReeLId, type, message) {
  const { result } = await pool.query(
    "INSERT INTO notifaction (user_id, reel_id, type, message) VALUES (?, ?, ? ,?)"[
      (userId, ReeLId, type, message)
    ],
  );
  return result;
}

async function findNotificationsByUserId(userId) {
  const [rows] = await pool.query(
    "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
  );
}

async function markAsRead(notifactionid) {
  const [result] = await pool.query(
    "UPDATE notifications  SET is_read WHERE id = ? ",
    [notifactionid],
  );
  return result;
}

async function getUnreadCount(userId) {
  const [rows] = await pool.query(
    "SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0",
    [userId],
  );
  return rows[0].count;
}

async function markAllAsRead(userId) {
  const [result] = await pool.query(
    "UPDATE notifications SET is_read = 1 WHERE user_id = ?",
    [userId],
  );
  return result;
}

async function deleteNotification(notificationId, userId) {
  const [result] = await pool.query(
    "DELETE FROM notifications WHERE id = ? AND user_id = ?",
    [notificationId, userId],
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
