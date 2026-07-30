const pool = require("../../config/db.config");

async function createReel(userId, title, description, rawS3Key, category) {
  const [result] = await pool.query(
    "INSERT INTO reels (user_id, title, description, raw_s3_key, category, status) VALUES (?,?,?,?,?,?)",
    [userId, title, description, rawS3Key, category, "pending_review"],
  );
  console.log("RAW queryResult:", result);
  return result;
}

async function findFeedReels() {
  const [rows] = await pool.query(
    'SELECT * FROM reels WHERE status = "published" ORDER BY created_at DESC',
  );
  return rows;
}

async function findReelById(id) {
  const [rows] = await pool.query("SELECT * FROM reels WHERE id = ?", [id]);
  return rows[0];
}

async function deleteReelById(id) {
  const [result] = await pool.query("DELETE FROM reels WHERE id = ?", [id]);

  return result;
}

async function addLike(reelId, userId) {
  const [result] = await pool.query(
    "INSERT INTO reel_likes (user_id, reel_id) VALUES (?, ?)",
    [userId, reelId],
  );

  return result;
}

async function removeLike(reelId, userId) {
  const [result] = await pool.query(
    "DELETE FROM reel_likes WHERE reel_id = ? AND user_id = ?",
    [reelId, userId],
  );

  return result;
}

async function incrementLikeCount(reelId) {
  const [result] = await pool.query(
    "UPDATE reels SET like_count = like_count + 1 WHERE id = ?",
    [reelId],
  );

  return result;
}

async function decrementLikeCount(reelId) {
  const [result] = await pool.query(
    "UPDATE reels SET like_count = like_count - 1 WHERE id = ?",
    [reelId],
  );

  return result;
}

async function addView(reelId, userId, watchDuration) {
  const [result] = await pool.query(
    "INSERT INTO reel_views (reel_id, user_id, watch_duration) VALUES (?, ?, ?)",
    [reelId, userId, watchDuration],
  );
  return result;
}

async function incrementViewCount(reelId) {
  const [result] = await pool.query(
    "UPDATE reels SET view_count = view_count + 1 WHERE id = ?",
    [reelId],
  );
  return result;
}

async function updateReelMetadata(id, updates) {
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

  const [result] = await pool.query(
    `UPDATE reels SET ${fields.join(", ")} WHERE id = ?`,
    values,
  );
  return result;
}

async function findReelsByUserId(userId) {
  const [rows] = await pool.query(
    "SELECT * FROM reels WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
  );
  return rows;
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
  findReelsByUserId
};