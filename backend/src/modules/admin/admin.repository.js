const pool = require("../../config/db.config");
const { REEL_STATUS } = require("../../constants/enums");

async function findAdminByUsernameOrEmail(identifier) {
  const [rows] = await pool.query(
    "SELECT * FROM admins WHERE username = ? OR email = ?",
    [identifier, identifier],
  );
  return rows[0];
}

async function CreatedAdmins(username, email, passwordHash, role) {
  const [result] = await pool.query(
    "INSERT INTO admins (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
    [username, email, passwordHash, role],
  );

  return result;
}

async function findPendingReels() {
  const [rows] = await pool.query(
    "SELECT * FROM reels WHERE status = ? ORDER BY created_at ASC",
    [REEL_STATUS.PENDING_REVIEW],
  ); // show old reel first
  return rows;
}

async function approveReel(id, adminId) {
  const [result] = await pool.query(
    "UPDATE reels SET status = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?",
    [REEL_STATUS.PUBLISHED, adminId, id],
  );
  return result;
}

async function rejectReel(id, adminId, reason) {
  const [result] = await pool.query(
    "UPDATE reels SET status = ?, reviewed_by = ?, reviewed_at = NOW(), rejection_reason = ? WHERE id = ?",
    [REEL_STATUS.REJECTED, adminId, reason, id],
  );
  return result;
}

async function deleteReel(id, adminId, reason) {
  const [result] = await pool.query(
    "UPDATE reels SET status = ?, reviewed_by = ?, reviewed_at = NOW(), rejection_reason = ? WHERE id = ?",
    [REEL_STATUS.DELETED, adminId, reason, id],
  );
  return result;
}

module.exports = {
  findAdminByUsernameOrEmail,
  CreatedAdmins,
  findPendingReels,
  approveReel,
  rejectReel,
  deleteReel
};

