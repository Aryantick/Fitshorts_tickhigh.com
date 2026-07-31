const { redis, getTenantKey } = require("../utils/redis.util");
const ReelsRepository = require("../modules/reels/reels.repository");

/**
 * Periodically sync real-time views and likes from Redis to MySQL DB
 */
async function syncCountersToDB(tenantId = "default") {
  console.log(`[Sync Worker] Starting Redis -> MySQL sync for tenant: ${tenantId}...`);

  try {
    const dirtyViewsKey = getTenantKey(tenantId, "reel", "dirty_views");
    const dirtyLikesKey = getTenantKey(tenantId, "reel", "dirty_likes");

    // Pop dirty reel IDs
    const dirtyViewReelIds = await redis.smembers(dirtyViewsKey);
    const dirtyLikeReelIds = await redis.smembers(dirtyLikesKey);

    const allReelIds = Array.from(new Set([...dirtyViewReelIds, ...dirtyLikeReelIds]));

    if (allReelIds.length === 0) {
      console.log("[Sync Worker] No dirty counters to sync.");
      return;
    }

    console.log(`[Sync Worker] Syncing ${allReelIds.length} reels to MySQL...`);

    for (const reelId of allReelIds) {
      const viewsKey = getTenantKey(tenantId, "reel", `${reelId}:views`);
      const likesKey = getTenantKey(tenantId, "reel", `${reelId}:likes`);

      const [views, likes] = await redis.mget(viewsKey, likesKey);
      const viewsCount = views ? parseInt(views, 10) : 0;
      const likesCount = likes ? parseInt(likes, 10) : 0;

      await ReelsRepository.updateCounts(reelId, viewsCount, likesCount);
    }

    // Clear processed dirty sets
    if (dirtyViewReelIds.length > 0) {
      await redis.srem(dirtyViewsKey, ...dirtyViewReelIds);
    }
    if (dirtyLikeReelIds.length > 0) {
      await redis.srem(dirtyLikesKey, ...dirtyLikeReelIds);
    }

    console.log("[Sync Worker] Redis -> MySQL sync completed successfully.");
  } catch (error) {
    console.error("[Sync Worker] Error during counter sync:", error.message);
  }
}

// Run sync every 3 minutes if executed directly
if (require.main === module) {
  const SYNC_INTERVAL_MS = 3 * 60 * 1000;
  console.log(`[Sync Worker] Started loop (Interval: ${SYNC_INTERVAL_MS / 1000}s)`);
  
  // Run immediately on startup
  syncCountersToDB("default");

  setInterval(() => {
    syncCountersToDB("default");
  }, SYNC_INTERVAL_MS);
}

module.exports = {
  syncCountersToDB,
};
