const pool = require("../../config/db.config");

async function findRefreshTokensByUserId(userId) {
  const [rows] = await pool.query(
    "SELECT * FROM refresh_tokens WHERE user_id = ? ORDER BY created_at DESC",
    [userId]
  );
  return rows;
}

async function saveRefreshToken(userId, tokenHash, expiresAt, deviceId = null, ipAddress = null) {
  const [result] = await pool.query(
    "INSERT INTO refresh_tokens (user_id, token_hash, device_id, ip_address, expires_at) VALUES (?, ?, ?, ?, ?)",
    [userId, tokenHash, deviceId, ipAddress, expiresAt]
  );
  return result;
}

async function revokeRefreshToken(tokenId) {
  const [result] = await pool.query(
    "UPDATE refresh_tokens SET is_revoked = 1 WHERE id = ?",
    [tokenId]
  );
  return result;
}

// /
async function deleteRefreshTokensByUserId(userId) {
  await pool.query(
    "DELETE FROM refresh_tokens WHERE user_id = ?",
    [userId],
  );
}

module.exports = {
  findRefreshTokensByUserId,
  saveRefreshToken,
  revokeRefreshToken,
  deleteRefreshTokensByUserId
};