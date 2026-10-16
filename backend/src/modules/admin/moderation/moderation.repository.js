const pool = require("../../../config/db.config");
const { REEL_STATUS } = require("../../../constants/enums");

/**
 * High-Production Optimized Reels Moderation Listing
 * Avoids unnecessary joins on count queries and leverages composite index (status, created_at).
 */
async function findReels({
  status = "all",
  clientId = null,
  categoryId = null,
  search = null,
  page = 1,
  limit = 10,
}) {
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.max(1, Math.min(100, Number(limit)));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  const params = [];

  if (status && status !== "all") {
    if (status === "live" || status === "published") {
      conditions.push("r.status IN ('approved', 'published')");
    } else {
      conditions.push("r.status = ?");
      params.push(status);
    }
  } else {
    // Exclude soft-deleted reels from general list
    conditions.push("r.status != 'deleted'");
  }

  if (clientId && clientId !== "all") {
    conditions.push("r.client_id = ?");
    params.push(Number(clientId));
  }

  if (categoryId && categoryId !== "all") {
    conditions.push("r.category_id = ?");
    params.push(Number(categoryId));
  }

  const hasSearch = search && search.trim().length > 0;
  if (hasSearch) {
    const term = `%${search.trim()}%`;
    conditions.push(
      "(r.id = ? OR r.title LIKE ? OR r.description LIKE ? OR u.msisdn LIKE ? OR u.display_name LIKE ?)"
    );
    const searchId = isNaN(search.trim()) ? 0 : Number(search.trim());
    params.push(searchId, term, term, term, term);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // High-performance Count query: Only join users table if search filters by user name/phone
  const countSql = hasSearch
    ? `SELECT COUNT(*) AS total FROM reels r LEFT JOIN users u ON r.user_id = u.id ${whereClause}`
    : `SELECT COUNT(*) AS total FROM reels r ${whereClause}`;

  const [countResult] = await pool.query(countSql, params);
  const total = countResult[0] ? countResult[0].total : 0;

  if (total === 0) {
    return {
      reels: [],
      total: 0,
      page: pageNum,
      limit: limitNum,
      totalPages: 1,
    };
  }

  // FIFO order for pending review (oldest first); newest first for others
  const orderClause =
    status === "pending_review" ? "ORDER BY r.created_at ASC" : "ORDER BY r.created_at DESC";

  // Data query with primary key joins on the paginated slice
  const dataSql = `
    SELECT 
      r.id,
      r.user_id,
      r.client_id,
      r.title,
      r.description,
      r.raw_s3_key,
      r.hls_s3_key,
      r.thumb_s3_key,
      r.duration_sec,
      r.status,
      r.transcoding_status,
      r.category_id,
      r.category,
      r.music_id,
      r.view_count,
      r.like_count,
      r.share_count,
      r.save_count,
      r.is_featured,
      r.reviewed_at,
      r.reviewed_by,
      r.rejection_reason,
      r.created_at,
      r.updated_at,
      u.display_name AS creator_name,
      u.msisdn AS creator_msisdn,
      u.avatar_key AS creator_avatar,
      cl.name AS client_name,
      c.name AS category_name,
      a.username AS reviewer_username
    FROM reels r
    LEFT JOIN users u ON r.user_id = u.id
    LEFT JOIN clients cl ON r.client_id = cl.id
    LEFT JOIN categories c ON r.category_id = c.id
    LEFT JOIN admins a ON r.reviewed_by = a.id
    ${whereClause}
    ${orderClause}
    LIMIT ? OFFSET ?
  `;

  const [reels] = await pool.query(dataSql, [...params, limitNum, offset]);

  return {
    reels,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum) || 1,
  };
}

async function findReelDetailsById(id) {
  const sql = `
    SELECT 
      r.*,
      u.display_name AS creator_name,
      u.msisdn AS creator_msisdn,
      u.avatar_key AS creator_avatar,
      u.is_blocked AS creator_is_blocked,
      cl.name AS client_name,
      cl.subdomain AS client_subdomain,
      c.name AS category_name,
      a.username AS reviewer_username,
      mt.title AS music_title,
      mt.artist AS music_artist,
      mt.s3_key AS music_s3_key
    FROM reels r
    LEFT JOIN users u ON r.user_id = u.id
    LEFT JOIN clients cl ON r.client_id = cl.id
    LEFT JOIN categories c ON r.category_id = c.id
    LEFT JOIN admins a ON r.reviewed_by = a.id
    LEFT JOIN music_tracks mt ON r.music_id = mt.id
    WHERE r.id = ?
  `;
  const [rows] = await pool.query(sql, [id]);
  return rows[0] || null;
}

async function approveReel(id, adminId) {
  const [result] = await pool.query(
    "UPDATE reels SET status = ?, reviewed_by = ?, reviewed_at = NOW(), rejection_reason = NULL WHERE id = ?",
    [REEL_STATUS.PUBLISHED, adminId, id]
  );
  return result;
}

async function rejectReel(id, adminId, reason) {
  const [result] = await pool.query(
    "UPDATE reels SET status = ?, reviewed_by = ?, reviewed_at = NOW(), rejection_reason = ? WHERE id = ?",
    [REEL_STATUS.REJECTED, adminId, reason, id]
  );
  return result;
}

async function suspendReel(id, adminId, reason) {
  const [result] = await pool.query(
    "UPDATE reels SET status = ?, reviewed_by = ?, reviewed_at = NOW(), rejection_reason = ? WHERE id = ?",
    [REEL_STATUS.SUSPENDED, adminId, reason || "Suspended by admin", id]
  );
  return result;
}

async function deleteReel(id, adminId, reason) {
  const [result] = await pool.query(
    "UPDATE reels SET status = ?, reviewed_by = ?, reviewed_at = NOW(), rejection_reason = ? WHERE id = ?",
    [REEL_STATUS.DELETED, adminId, reason || "Permanently deleted by admin", id]
  );
  return result;
}

module.exports = {
  findReels,
  findReelDetailsById,
  approveReel,
  rejectReel,
  suspendReel,
  deleteReel,
};
