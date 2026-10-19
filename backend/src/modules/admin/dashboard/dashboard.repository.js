const pool = require("../../../config/db.config");

/**
 * Get current date string (YYYY-MM-DD) in Asia/Kolkata (IST) timezone
 */
function getTodayDateString() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

/**
 * Normalizes input date to YYYY-MM-DD format in Asia/Kolkata timezone
 */
function normalizeDateStr(dateInput) {
  if (!dateInput) return null;
  if (typeof dateInput === "string") {
    const trimmed = dateInput.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(d);
}

/**
 * High-Production Optimized Dashboard Statistics
 * Supports dynamic Date Range filtering (startDate, endDate)
 * and optional Multi-Tenant Client scoping (clientId).
 */
async function getDashboardStats({ clientId = null, startDate = null, endDate = null } = {}) {
  const clientFilter = clientId && clientId !== "all" ? Number(clientId) : null;

  // Track if user explicitly supplied date range filter from UI/query
  const isFiltered = Boolean(
    (startDate && String(startDate).trim().length > 0) ||
    (endDate && String(endDate).trim().length > 0)
  );

  // Default to today (Asia/Kolkata) if dates are not provided
  const today = getTodayDateString();
  let resolvedStartDate = normalizeDateStr(startDate) || today;
  let resolvedEndDate = normalizeDateStr(endDate) || today;

  if (resolvedStartDate > resolvedEndDate) {
    [resolvedStartDate, resolvedEndDate] = [resolvedEndDate, resolvedStartDate];
  }

  // Cover full day range: 00:00:00 to 23:59:59.999
  const startStr = `${resolvedStartDate} 00:00:00`;
  const endStr = `${resolvedEndDate} 23:59:59.999`;

  // 1. User stats (total_users & active_users remain overall; new_users_period is filtered by date range)
  let userSql = `
    SELECT 
      COUNT(DISTINCT u.id) AS total_users,
      COUNT(DISTINCT CASE WHEN u.is_active = 1 AND (u.is_blocked = 0 OR u.is_blocked IS NULL) THEN u.id END) AS active_users,
      COUNT(DISTINCT CASE WHEN u.created_at >= ? AND u.created_at <= ? THEN u.id END) AS new_users_period,
      COUNT(DISTINCT CASE WHEN u.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN u.id END) AS new_users_7d
    FROM users u
  `;
  const userParams = [startStr, endStr];

  if (clientFilter) {
    userSql += " INNER JOIN user_client_relations ucr ON u.id = ucr.user_id WHERE ucr.client_id = ?";
    userParams.push(clientFilter);
  }
  const [userStats] = await pool.query(userSql, userParams);

  // 2. Reels stats (scoped to resolved date range)
  let reelSql = `
    SELECT 
      COUNT(*) AS total_reels,
      COUNT(CASE WHEN status = 'pending_review' THEN 1 END) AS reels_pending,
      COUNT(CASE WHEN status IN ('approved', 'published') THEN 1 END) AS reels_approved,
      COUNT(CASE WHEN status = 'rejected' THEN 1 END) AS reels_rejected,
      COUNT(CASE WHEN status = 'suspended' THEN 1 END) AS reels_suspended,
      COALESCE(SUM(view_count), 0) AS total_views,
      COALESCE(SUM(like_count), 0) AS total_likes
    FROM reels
    WHERE created_at >= ? AND created_at <= ?
  `;
  const reelParams = [startStr, endStr];
  if (clientFilter) {
    reelSql += " AND client_id = ?";
    reelParams.push(clientFilter);
  }
  const [reelStats] = await pool.query(reelSql, reelParams);

  // 3. Top categories breakdown (scoped to resolved date range)
  let catSql = `
    SELECT 
      COALESCE(c.name, r.category, 'Uncategorized') AS category_name,
      COUNT(r.id) AS count,
      COALESCE(SUM(r.view_count), 0) AS total_views
    FROM reels r
    LEFT JOIN categories c ON r.category_id = c.id
    WHERE r.created_at >= ? AND r.created_at <= ?
  `;
  const catParams = [startStr, endStr];
  if (clientFilter) {
    catSql += " AND r.client_id = ?";
    catParams.push(clientFilter);
  }
  catSql += " GROUP BY category_name ORDER BY count DESC LIMIT 8";
  const [topCategories] = await pool.query(catSql, catParams);

  // 4. Top Creators Leaderboard (Top 5, scoped to resolved date range)
  let topUserSql = `
    SELECT 
      user_id,
      COUNT(id) AS total_reels,
      COALESCE(SUM(view_count), 0) AS total_views,
      COALESCE(SUM(like_count), 0) AS total_likes
    FROM reels
    WHERE created_at >= ? AND created_at <= ?
  `;
  const topUserParams = [startStr, endStr];
  if (clientFilter) {
    topUserSql += " AND client_id = ?";
    topUserParams.push(clientFilter);
  }
  topUserSql += " GROUP BY user_id ORDER BY total_views DESC LIMIT 5";
  const [creatorAggs] = await pool.query(topUserSql, topUserParams);

  let topCreators = [];
  if (creatorAggs.length > 0) {
    const creatorIds = creatorAggs.map((c) => c.user_id);
    const [userRows] = await pool.query(
      "SELECT id, display_name, msisdn, avatar_key FROM users WHERE id IN (?)",
      [creatorIds]
    );
    const userMap = new Map();
    userRows.forEach((u) => userMap.set(u.id, u));

    topCreators = creatorAggs.map((c, idx) => {
      const u = userMap.get(c.user_id) || {};
      return {
        rank: idx + 1,
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

  // 5. Daily uploads trend (scoped to resolved date range)
  let trendSql = `
    SELECT 
      DATE_FORMAT(created_at, '%Y-%m-%d') AS date,
      COUNT(*) AS total_uploads,
      COUNT(CASE WHEN status IN ('approved', 'published') THEN 1 END) AS approved_count,
      COUNT(CASE WHEN status = 'rejected' THEN 1 END) AS rejected_count
    FROM reels
    WHERE created_at >= ? AND created_at <= ?
  `;
  const trendParams = [startStr, endStr];
  if (clientFilter) {
    trendSql += " AND client_id = ?";
    trendParams.push(clientFilter);
  }
  trendSql += " GROUP BY date ORDER BY date ASC";
  const [dailyUploadsTrend] = await pool.query(trendSql, trendParams);

  return {
    date_range: {
      startDate: resolvedStartDate,
      endDate: resolvedEndDate,
      isFiltered: isFiltered,
    },
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
