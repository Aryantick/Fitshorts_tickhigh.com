const pool = require("../../../config/db.config");

/**
 * High-Production Optimized Leaderboard
 * Computes rankings on reels table directly, then hydrates user and category metadata in O(limit).
 */
async function getLeaderboard({ period = "all_time", clientId = null, limit = 5 }) {
  const limitNum = Math.max(1, Math.min(5, Number(limit || 5)));
  const clientFilter = clientId && clientId !== "all" ? Number(clientId) : null;

  let dateFilter = "";
  if (period === "daily") {
    dateFilter = "AND created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)";
  } else if (period === "weekly") {
    dateFilter = "AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
  } else if (period === "monthly") {
    dateFilter = "AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
  }

  // 1. Production Top Creators: Group on reels directly using status index
  let creatorSql = `
    SELECT 
      user_id,
      COUNT(id) AS approved_reels,
      COALESCE(SUM(view_count), 0) AS total_views,
      COALESCE(SUM(like_count), 0) AS total_likes,
      COALESCE(SUM(share_count), 0) AS total_shares,
      COALESCE(SUM(save_count), 0) AS total_saves,
      (COALESCE(SUM(view_count), 0) * 1 + COALESCE(SUM(like_count), 0) * 2 + COALESCE(SUM(share_count), 0) * 3) AS score
    FROM reels
    WHERE status IN ('approved', 'published') ${dateFilter}
  `;
  const creatorParams = [];
  if (clientFilter) {
    creatorSql += ` AND client_id = ?`;
    creatorParams.push(clientFilter);
  }
  creatorSql += ` GROUP BY user_id ORDER BY score DESC, total_views DESC LIMIT ?`;
  creatorParams.push(limitNum);

  const [creatorAggs] = await pool.query(creatorSql, creatorParams);

  let rankedCreators = [];
  if (creatorAggs.length > 0) {
    const creatorUserIds = creatorAggs.map((c) => c.user_id);
    const [userRows] = await pool.query(
      `SELECT id, display_name, msisdn, avatar_key FROM users WHERE id IN (?)`,
      [creatorUserIds]
    );
    const userMap = new Map();
    userRows.forEach((u) => userMap.set(u.id, u));

    rankedCreators = creatorAggs.map((c, index) => {
      const u = userMap.get(c.user_id) || {};
      return {
        rank: index + 1,
        user_id: c.user_id,
        display_name: u.display_name || "Unknown Creator",
        msisdn: u.msisdn || "",
        avatar_key: u.avatar_key || null,
        approved_reels: Number(c.approved_reels),
        total_views: Number(c.total_views),
        total_likes: Number(c.total_likes),
        total_shares: Number(c.total_shares),
        total_saves: Number(c.total_saves),
        score: Number(c.score),
      };
    });
  }

  // 2. Top Reels
  let reelSql = `
    SELECT 
      r.id,
      r.title,
      r.thumb_s3_key,
      r.duration_sec,
      r.view_count,
      r.like_count,
      r.share_count,
      r.save_count,
      r.created_at,
      u.id AS user_id,
      u.display_name AS creator_name,
      u.msisdn AS creator_msisdn,
      c.name AS category_name,
      (r.view_count * 1 + r.like_count * 2 + r.share_count * 3) AS score
    FROM reels r
    LEFT JOIN users u ON r.user_id = u.id
    LEFT JOIN categories c ON r.category_id = c.id
    WHERE r.status IN ('approved', 'published') ${dateFilter ? "AND r." + dateFilter.slice(4) : ""}
  `;
  const reelParams = [];
  if (clientFilter) {
    reelSql += ` AND r.client_id = ?`;
    reelParams.push(clientFilter);
  }
  reelSql += ` ORDER BY score DESC, r.view_count DESC LIMIT ?`;
  reelParams.push(limitNum);

  const [topReels] = await pool.query(reelSql, reelParams);

  return {
    period,
    creators: rankedCreators,
    reels: topReels.map((r, index) => ({ rank: index + 1, ...r })),
  };
}

module.exports = {
  getLeaderboard,
};
