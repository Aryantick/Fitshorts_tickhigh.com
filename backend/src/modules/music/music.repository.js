const pool = require("../../config/db.config");

async function CreateMusic(title, artist, s3Key, durationSec, adminId, category) {
  const [result] = await pool.query(
    "INSERT INTO music_tracks (title, artist, s3_key, duration_sec, source_type, source_user_id, category, status) VALUES (?, ?, ?, ?, 'licensed', NULL, ?, 'active')",
    [title, artist, s3Key, durationSec || 0, category || "General"],
  );
  return result;
}

async function findbyMusic() {
  const [rows] = await pool.query(
    "SELECT * FROM music_tracks WHERE status = 'active' ORDER BY created_at DESC",
  );
  return rows;
}

async function findMusicByCategory(category) {
  const [rows] = await pool.query(
    "SELECT * FROM music_tracks WHERE status = 'active' AND category = ? ORDER BY created_at DESC",
    [category],
  );
  return rows;
}

async function incrementUsageCount(musicId) {
  const [result] = await pool.query(
    "UPDATE music_tracks SET usage_count = usage_count + 1 WHERE id = ?",
    [musicId],
  );
  return result;
}

//findTrandingMusic
async function findTrandingMusic(limit = 10) {
  const [rows] =  await pool.query(
    "SELECT * FROM music_tracks WHERE status = 'active' ORDER BY usage_count DESC LIMIT ?",
    [limit]
  )
  return rows;
}



async function findMusicById(id) {
  const [rows] = await pool.query("SELECT * FROM music_tracks WHERE id = ?", [id]);
  return rows[0] || null;
}

async function deleteMusicById(id) {
  const [result] = await pool.query("DELETE FROM music_tracks WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

module.exports = {
  CreateMusic,
  findbyMusic,
  findMusicByCategory,
  incrementUsageCount,
  findTrandingMusic,
  findMusicById,
  deleteMusicById,
};