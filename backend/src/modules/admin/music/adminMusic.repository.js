const pool = require("../../../config/db.config");

async function createBulkMusicTracks(tracks) {
  if (!tracks || tracks.length === 0) return { insertedCount: 0 };

  const values = [];
  const placeholders = [];

  for (const track of tracks) {
    placeholders.push("(?, ?, ?, ?, 'licensed', NULL, ?, 'active')");
    values.push(
      track.title || "Untitled Track",
      track.artist || "Unknown Artist",
      track.s3Key,
      track.durationSec || 0,
      track.category || "General"
    );
  }

  const sql = `
    INSERT INTO music_tracks 
    (title, artist, s3_key, duration_sec, source_type, source_user_id, category, status) 
    VALUES ${placeholders.join(", ")}
  `;

  const [result] = await pool.query(sql, values);
  return { insertedCount: result.affectedRows };
}

module.exports = {
  createBulkMusicTracks,
};

