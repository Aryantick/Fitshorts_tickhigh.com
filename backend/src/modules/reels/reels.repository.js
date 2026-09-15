const pool = require("../../config/db.config");
const { REEL_STATUS } = require("../../constants/enums");

async function createReel(userId, title, description, rawS3Key, category, musicId, clientId = 1) {
  const [result] = await pool.query(
    "INSERT INTO reels (user_id, title, description, raw_s3_key, category, music_id, client_id, status, view_count, like_count) VALUES (?,?,?,?,?,?,?,?, 0, 0)",
    [userId, title, description, rawS3Key, category, musicId || null, clientId, REEL_STATUS.PENDING_REVIEW]
  );
  console.log("RAW queryResult:", result);
  return result;
}

async function findFeedReels(clientId = 1, page = 1, limit = 10) {
  const offset = (Math.max(1, Number(page)) - 1) * Number(limit);
  const [rows] = await pool.query(
    "SELECT * FROM reels WHERE status IN (?, ?) AND client_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
    [REEL_STATUS.PUBLISHED, REEL_STATUS.APPROVED, clientId, Number(limit), Number(offset)]
  );
  return rows;
}

async function findReelById(id, clientId) {
  if (clientId) {
    const [rows] = await pool.query("SELECT * FROM reels WHERE id = ? AND client_id = ?", [id, clientId]);
    return rows[0] || null;
  }
  const [rows] = await pool.query("SELECT * FROM reels WHERE id = ?", [id]);
  return rows[0] || null;
}

async function deleteReelById(id, clientId = 1) {
  const [result] = await pool.query("DELETE FROM reels WHERE id = ? AND client_id = ?", [id, clientId]);
  return result;
}

async function addLike(reelId, userId) {
  const [result] = await pool.query(
    "INSERT INTO reel_likes (user_id, reel_id) VALUES (?, ?)",
    [userId, reelId]
  );
  return result;
}

async function removeLike(reelId, userId) {
  const [result] = await pool.query(
    "DELETE FROM reel_likes WHERE reel_id = ? AND user_id = ?",
    [reelId, userId]
  );
  return result;
}

async function incrementLikeCount(reelId) {
  const [result] = await pool.query(
    "UPDATE reels SET like_count = like_count + 1 WHERE id = ?",
    [reelId]
  );
  return result;
}

async function decrementLikeCount(reelId) {
  const [result] = await pool.query(
    "UPDATE reels SET like_count = like_count - 1 WHERE id = ?",
    [reelId]
  );
  return result;
}

async function addView(reelId, userId, watchDuration) {
  const [result] = await pool.query(
    "INSERT INTO reel_views (reel_id, user_id, watch_duration) VALUES (?, ?, ?)",
    [reelId, userId, watchDuration]
  );
  return result;
}

async function incrementViewCount(reelId) {
  const [result] = await pool.query(
    "UPDATE reels SET view_count = view_count + 1 WHERE id = ?",
    [reelId]
  );
  return result;
}

async function updateReelMetadata(id, clientId, updates) {
  const fields = [];
  const values = [];

  if (updates.title !== undefined) {
    fields.push("title = ?");
    values.push(updates.title);
  }
  if (updates.description !== undefined) {
    fields.push("description = ?");
    values.push(updates.description);
  }
  if (updates.category !== undefined) {
    fields.push("category = ?");
    values.push(updates.category);
  }

  if (fields.length === 0) {
    throw new Error("No fields to update");
  }

  values.push(id);
  values.push(clientId);

  const [result] = await pool.query(
    `UPDATE reels SET ${fields.join(", ")} WHERE id = ? AND client_id = ?`,
    values
  );
  return result;
}

async function findReelsByUserId(userId, clientId = 1) {
  const [rows] = await pool.query(
    "SELECT * FROM reels WHERE user_id = ? AND client_id = ? ORDER BY created_at DESC",
    [userId, clientId]
  );
  return rows;
}

async function updateTranscodingResult(reelId, { thumbS3Key, hlsS3Key, status }) {
  const [result] = await pool.query(
    "UPDATE reels SET thumb_s3_key = ?, hls_s3_key = ?, transcoding_status = ? WHERE id = ?",
    [thumbS3Key, hlsS3Key, status, reelId]
  );
  return result;
}

async function updateCounts(reelId, viewsCount, likesCount) {
  const [result] = await pool.query(
    "UPDATE reels SET view_count = ?, like_count = ? WHERE id = ?",
    [viewsCount, likesCount, reelId]
  );
  return result;
}

module.exports = {
  createReel,
  findFeedReels,
  findReelById,
  deleteReelById,
  addLike,
  incrementLikeCount,
  removeLike,
  decrementLikeCount,
  addView,
  incrementViewCount,
  updateReelMetadata,
  findReelsByUserId,
  updateTranscodingResult,
  updateCounts,
};