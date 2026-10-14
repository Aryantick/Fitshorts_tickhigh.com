const pool = require("../../../config/db.config");

/**
 * High-Production Optimized Dashboard Statistics
 * Avoids mega-table Cartesian joins by grouping indexed metrics independently.
 */
async function getDashboardStats(clientId = null) {
  const clientFilter = clientId && clientId !== "all" ? Number(clientId) : null;

  // 1. User stats (Single row aggregate)
  let userSql = `
    SELECT 
      COUNT(DISTINCT u.id) AS total_users,
      COUNT(DISTINCT CASE WHEN u.is_active = 1 AND (u.is_blocked = 0 OR u.is_blocked IS NULL) THEN u.id END) AS active_users,
      COUNT(DISTINCT CASE WHEN u.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN u.id END) AS new_users_30d,
      COUNT(DISTINCT CASE WHEN u.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN u.id END) AS new_users_7d
    FROM users u
  `;
  const userParams = [];

  if (clientFilter) {
    userSql += ` INNER JOIN user_client_relations ucr ON u.id = ucr.user_id WHERE ucr.client_id = ?`;
    userParams.push(clientFilter);
  }
  const [userStats] = await pool.query(userSql, userParams);

  // 2. Reels stats (Single row aggregate on reels table)
  let reelSql = `
    SELECT 
      COUNT(*) AS total_reels,
      COUNT(CASE WHEN status = 'pending_review' THEN 1 END) AS reels_pending,
      COUNT(CASE WHEN status IN ('approved', 'published') THEN 1 END) AS reels_approved,
      COUNT(CASE WHEN status = 'rejected' THEN 1 END) AS reels_rejected,
      COUNT(CASE WHEN status = 'suspended' THEN 1 END) AS reels_suspended,
      COALESCE(SUM(view_count), 0) AS total_views,
      COALESCE(SUM(like_count), 0) AS total_likes,
      COALESCE(SUM(share_count), 0) AS total_shares,
      COALESCE(SUM(save_count), 0) AS total_saves
    FROM reels
  `;
  const reelParams = [];
  if (clientFilter) {
    reelSql += ` WHERE client_id = ?`;
    reelParams.push(clientFilter);
  }
  const [reelStats] = await pool.query(reelSql, reelParams);

  // 3. Top categories breakdown
  let catSql = `
    SELECT 
      COALESCE(c.name, r.category, 'Uncategorized') AS category_name,
      COUNT(r.id) AS count,
      COALESCE(SUM(r.view_count), 0) AS total_views
    FROM reels r
    LEFT JOIN categories c ON r.category_id = c.id
  `;
  const catParams = [];
  if (clientFilter) {
    catSql += ` WHERE r.client_id = ?`;
    catParams.push(clientFilter);
  }
  catSql += ` GROUP BY category_name ORDER BY count DESC LIMIT 8`;
  const [topCategories] = await pool.query(catSql, catParams);

  // 4. Production Optimized Top Creators:
  // Step 4a: Scan only reels table to find top 5 creator user_ids
  let topUserSql = `
    SELECT 
      user_id,
      COUNT(id) AS total_reels,
      COALESCE(SUM(view_count), 0) AS total_views,
      COALESCE(SUM(like_count), 0) AS total_likes
    FROM reels
  `;
  const topUserParams = [];
  if (clientFilter) {
    topUserSql += ` WHERE client_id = ?`;
    topUserParams.push(clientFilter);
  }
  topUserSql += ` GROUP BY user_id ORDER BY total_views DESC LIMIT 5`;
  const [creatorAggs] = await pool.query(topUserSql, topUserParams);

  let topCreators = [];
  if (creatorAggs.length > 0) {
    const creatorIds = creatorAggs.map((c) => c.user_id);
    const [userRows] = await pool.query(
      `SELECT id, display_name, msisdn, avatar_key FROM users WHERE id IN (?)`,
      [creatorIds]
    );
    const userMap = new Map();
    userRows.forEach((u) => userMap.set(u.id, u));

    topCreators = creatorAggs.map((c) => {
      const u = userMap.get(c.user_id) || {};
      return {
        user_id: c.user_id,
        display_name: u.display_name || "Unknown Creator",
        msisdn: u.msisdn || "",
        avatar_key: u.avatar_key || null,
        total_reels: Number(c.total_reels),
        total_views: Number(c.total_views),
        total_likes: Number(c.total_likes),
      };
    });
  }

  // 5. Daily uploads trend (Last 14 days)
  let trendSql = `
    SELECT 
      DATE_FORMAT(created_at, '%Y-%m-%d') AS date,
      COUNT(*) AS total_uploads,
      COUNT(CASE WHEN status IN ('approved', 'published') THEN 1 END) AS approved_count,
      COUNT(CASE WHEN status = 'rejected' THEN 1 END) AS rejected_count
    FROM reels
    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
  `;
  const trendParams = [];
  if (clientFilter) {
    trendSql += ` AND client_id = ?`;
    trendParams.push(clientFilter);
  }
  trendSql += ` GROUP BY date ORDER BY date ASC`;
  const [dailyUploadsTrend] = await pool.query(trendSql, trendParams);

  return {
    users: userStats[0] || {},
    reels: reelStats[0] || {},
    top_categories: topCategories,
    top_creators: topCreators,
    daily_trend: dailyUploadsTrend,
  };
}

async function findAllClients() {
  const [clients] = await pool.query(
    "SELECT id, name, subdomain, country_code, is_active FROM clients ORDER BY id ASC"
  );
  return clients;
}

module.exports = {
  getDashboardStats,
  findAllClients,
};
