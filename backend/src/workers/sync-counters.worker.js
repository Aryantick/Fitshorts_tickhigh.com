const pool = require("../config/db.config");
const { redis, getTenantKey } = require("../utils/redis.util");

/**
 * Periodically sync views and likes from child tables (reel_views, reel_likes)
 * and Redis dirty sets directly to the master "reels" table.
 * Runs every 2 minutes.
 */
async function syncCountersToDB() {
  console.log("[Sync Worker] Starting Child Tables -> Master Reels sync...");

  try {
    // 1. Sync from permanent child tables (reel_views & reel_likes) to master table reels
    const [result] = await pool.query(`
      UPDATE reels r 
      JOIN (
        SELECT r.id, 
               (SELECT COUNT(*) FROM reel_views v WHERE v.reel_id = r.id) AS v_cnt,
               (SELECT COUNT(*) FROM reel_likes l WHERE l.reel_id = r.id) AS l_cnt
        FROM reels r
      ) agg ON r.id = agg.id
      SET r.view_count = agg.v_cnt,
          r.like_count = agg.l_cnt
      WHERE r.view_count != agg.v_cnt OR r.like_count != agg.l_cnt;
    `);

    const changedCount = result.changedRows || 0;
    console.log(`[Sync Worker] Child tables -> Master reels sync completed. Updated ${changedCount} reels.`);

    // 2. Also clear any pending Redis dirty keys if Redis is available
    if (redis && redis.status === "ready") {
      try {
        const dirtyKeys = await redis.keys("*:dirty_*");
        if (dirtyKeys && dirtyKeys.length > 0) {
          await redis.del(...dirtyKeys);
        }
      } catch (redisErr) {
        // Non-fatal
      }
    }
  } catch (error) {
    console.error("[Sync Worker] Error during child -> master sync:", error.message);
  }
}

// 2-Minute Sync Interval
const SYNC_INTERVAL_MS = 2 * 60 * 1000;

function startSyncWorker(intervalMs = SYNC_INTERVAL_MS) {
  console.log(`[Sync Worker] Initialized 2-minute loop (Interval: ${intervalMs / 1000}s)`);
  // Run on startup
  syncCountersToDB();

  // Run every 2 minutes
  return setInterval(() => {
    syncCountersToDB();
  }, intervalMs);
}

if (require.main === module) {
  startSyncWorker();
}

module.exports = {
  syncCountersToDB,
  startSyncWorker,
};
