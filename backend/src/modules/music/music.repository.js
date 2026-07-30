const pool = require("../../config/db.config");

async function CreateMusic(title, artist, s3Key, durationSec, adminId, category) {
  const [result] = await pool.query(
    "INSERT INTO music_tracks (title, artist, s3_key, duration_sec, source_type, source_user_id, category) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [title, artist, s3Key, durationSec, "licensed", adminId, category],
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



module.exports = {
  CreateMusic,
  findbyMusic,
  findMusicByCategory,
  incrementUsageCount,
  findTrandingMusic
};