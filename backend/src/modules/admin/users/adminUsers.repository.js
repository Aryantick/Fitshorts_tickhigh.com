const pool = require("../../../config/db.config");

/**
 * High-Production Optimized Users Listing
 * Uses 2-Step batch aggregation instead of a massive multi-table GROUP BY.
 * Step 1: Paginate the users table directly using index (LIMIT & OFFSET).
 * Step 2: Fetch reel aggregations ONLY for the returned subset of user IDs.
 */
async function findUsers({
  clientId = null,
  search = null,
  isBlocked = null,
  page = 1,
  limit = 10,
}) {
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.max(1, Math.min(100, Number(limit)));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  const params = [];

  if (clientId && clientId !== "all") {
    conditions.push("ucr.client_id = ?");
    params.push(Number(clientId));
  }

  if (isBlocked !== null && isBlocked !== undefined && isBlocked !== "all") {
    conditions.push("u.is_blocked = ?");
    params.push(isBlocked === "true" || isBlocked === 1 || isBlocked === "1" ? 1 : 0);
  }

  if (search && search.trim().length > 0) {
    const term = `%${search.trim()}%`;
    conditions.push("(u.id = ? OR u.msisdn LIKE ? OR u.display_name LIKE ?)");
    const searchId = isNaN(search.trim()) ? 0 : Number(search.trim());
    params.push(searchId, term, term);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // 1. Lightweight Count Query
  let countSql = `SELECT COUNT(DISTINCT u.id) AS total FROM users u`;
  if (clientId && clientId !== "all") {
    countSql += ` INNER JOIN user_client_relations ucr ON u.id = ucr.user_id`;
  }
  countSql += ` ${whereClause}`;

  const [countResult] = await pool.query(countSql, params);
  const total = countResult[0] ? countResult[0].total : 0;

  if (total === 0) {
    return {
      users: [],
      total: 0,
      page: pageNum,
      limit: limitNum,
      totalPages: 1,
    };
  }

  // 2. High-speed Paginated Users Fetch (No join on reels table)
  let userSql = `
    SELECT 
      u.id,
      u.msisdn,
      u.display_name,
      u.avatar_key,
      u.is_active,
      u.is_blocked,
      u.block_reason,
      u.blocked_at,
      u.created_at,
      u.updated_at
    FROM users u
  `;

  if (clientId && clientId !== "all") {
    userSql += ` INNER JOIN user_client_relations ucr ON u.id = ucr.user_id`;
  }

  userSql += `
    ${whereClause}
    ORDER BY u.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const [users] = await pool.query(userSql, [...params, limitNum, offset]);

  if (users.length === 0) {
    return {
      users: [],
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    };
  }

  // 3. Batch Aggregate Reel Stats ONLY for the 10-20 fetched user IDs
  const userIds = users.map((u) => u.id);
  const [statsRows] = await pool.query(
    `SELECT 
      user_id,
      COUNT(*) AS total_reels,
      COUNT(CASE WHEN status IN ('approved', 'published') THEN 1 END) AS approved_reels,
      COUNT(CASE WHEN status = 'rejected' THEN 1 END) AS rejected_reels,
      COALESCE(SUM(view_count), 0) AS total_views,
      COALESCE(SUM(like_count), 0) AS total_likes
    FROM reels
    WHERE user_id IN (?)
    GROUP BY user_id`,
    [userIds]
  );

  const statsMap = new Map();
  for (const s of statsRows) {
    statsMap.set(s.user_id, s);
  }

  const enrichedUsers = users.map((u) => {
    const s = statsMap.get(u.id);
    return {
      ...u,
      total_reels: s ? Number(s.total_reels) : 0,
      approved_reels: s ? Number(s.approved_reels) : 0,
      rejected_reels: s ? Number(s.rejected_reels) : 0,
      total_views: s ? Number(s.total_views) : 0,
      total_likes: s ? Number(s.total_likes) : 0,
    };
  });

  return {
    users: enrichedUsers,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum) || 1,
  };
}

/**
 * High-Production Optimized Single User Details
 */
async function findUserDetailsById(id) {
  const [userRows] = await pool.query(
    `SELECT 
      id,
      msisdn,
      display_name,
      avatar_key,
      is_active,
      is_blocked,
      block_reason,
      blocked_at,
      created_at,
      updated_at
     FROM users 
     WHERE id = ?`,
    [id]
  );

  if (!userRows[0]) return null;
  const user = userRows[0];

  const [statsRows] = await pool.query(
    `SELECT 
      COUNT(*) AS total_reels,
      COUNT(CASE WHEN status IN ('approved', 'published') THEN 1 END) AS approved_reels,
      COUNT(CASE WHEN status = 'rejected' THEN 1 END) AS rejected_reels,
      COUNT(CASE WHEN status = 'pending_review' THEN 1 END) AS pending_reels,
      COALESCE(SUM(view_count), 0) AS total_views,
      COALESCE(SUM(like_count), 0) AS total_likes,
      COALESCE(SUM(share_count), 0) AS total_shares
    FROM reels 
    WHERE user_id = ?`,
    [id]
  );

  const s = statsRows[0] || {};
  return {
    ...user,
    total_reels: Number(s.total_reels || 0),
    approved_reels: Number(s.approved_reels || 0),
    rejected_reels: Number(s.rejected_reels || 0),
    pending_reels: Number(s.pending_reels || 0),
    total_views: Number(s.total_views || 0),
    total_likes: Number(s.total_likes || 0),
    total_shares: Number(s.total_shares || 0),
  };
}

async function findUserUploadedReels(userId, page = 1, limit = 10) {
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.max(1, Math.min(100, Number(limit)));
  const offset = (pageNum - 1) * limitNum;

  const [countResult] = await pool.query(
    "SELECT COUNT(*) AS total FROM reels WHERE user_id = ?",
    [userId]
  );
  const total = countResult[0] ? countResult[0].total : 0;

  const [reels] = await pool.query(
    `SELECT 
      r.*,
      c.name AS category_name,
      a.username AS reviewer_username
     FROM reels r
     LEFT JOIN categories c ON r.category_id = c.id
     LEFT JOIN admins a ON r.reviewed_by = a.id
     WHERE r.user_id = ?
     ORDER BY r.created_at DESC
     LIMIT ? OFFSET ?`,
    [userId, limitNum, offset]
  );

  return {
    reels,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum) || 1,
  };
}

async function updateUserBlockStatus(userId, isBlocked, reason = null) {
  const [result] = await pool.query(
    `UPDATE users 
     SET is_blocked = ?, 
         block_reason = ?, 
         blocked_at = ${isBlocked ? "NOW()" : "NULL"} 
     WHERE id = ?`,
    [isBlocked ? 1 : 0, isBlocked ? reason : null, userId]
  );
  return result;
}

module.exports = {
  findUsers,
  findUserDetailsById,
  findUserUploadedReels,
  updateUserBlockStatus,
};
