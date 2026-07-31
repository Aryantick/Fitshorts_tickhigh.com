const Redis = require("ioredis");
const redisConfig = require("../config/redis.config");

const redis = new Redis({
  host: redisConfig.host,
  port: redisConfig.port,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on("connect", () => {
  console.log("Connected to Redis successfully.");
});

redis.on("error", (err) => {
  console.error("Redis Error:", err.message);
});

/**
 * Format tenant-isolated Redis Key
 * Pattern: tenant:{tenantId}:{module}:{key}
 */
function getTenantKey(tenantId, moduleName, key) {
  const tid = tenantId || "default";
  return `tenant:${tid}:${moduleName}:${key}`;
}

/**
 * Increment Real-Time View Count in Redis
 */
async function incrementViewCount(tenantId, reelId) {
  const key = getTenantKey(tenantId, "reel", `${reelId}:views`);
  const newCount = await redis.incr(key);
  
  // Track modified keys for batch syncing to DB
  await redis.sadd(getTenantKey(tenantId, "reel", "dirty_views"), reelId);
  return newCount;
}

/**
 * Increment Real-Time Like Count in Redis
 */
async function incrementLikeCount(tenantId, reelId) {
  const key = getTenantKey(tenantId, "reel", `${reelId}:likes`);
  const newCount = await redis.incr(key);
  
  // Track modified keys for batch syncing to DB
  await redis.sadd(getTenantKey(tenantId, "reel", "dirty_likes"), reelId);
  return newCount;
}

/**
 * Decrement Real-Time Like Count in Redis
 */
async function decrementLikeCount(tenantId, reelId) {
  const key = getTenantKey(tenantId, "reel", `${reelId}:likes`);
  const count = await redis.get(key);
  if (count && parseInt(count, 10) > 0) {
    const newCount = await redis.decr(key);
    await redis.sadd(getTenantKey(tenantId, "reel", "dirty_likes"), reelId);
    return newCount;
  }
  return 0;
}

/**
 * Get Real-Time Stats (Views & Likes) from Redis
 */
async function getRealtimeStats(tenantId, reelId) {
  const viewsKey = getTenantKey(tenantId, "reel", `${reelId}:views`);
  const likesKey = getTenantKey(tenantId, "reel", `${reelId}:likes`);

  const [views, likes] = await redis.mget(viewsKey, likesKey);

  return {
    views: views ? parseInt(views, 10) : 0,
    likes: likes ? parseInt(likes, 10) : 0,
  };
}

/**
 * Cache Tenant Configuration
 */
async function cacheTenantConfig(domain, config, ttlSeconds = 3600) {
  const key = `tenant:domain:${domain}`;
  await redis.setex(key, ttlSeconds, JSON.stringify(config));
}

/**
 * Get Cached Tenant Configuration
 */
async function getTenantConfig(domain) {
  const key = `tenant:domain:${domain}`;
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

/**
 * Invalidate Tenant Config Cache
 */
async function invalidateTenantConfig(domain) {
  const key = `tenant:domain:${domain}`;
  await redis.del(key);
}

module.exports = {
  redis,
  getTenantKey,
  incrementViewCount,
  incrementLikeCount,
  decrementLikeCount,
  getRealtimeStats,
  cacheTenantConfig,
  getTenantConfig,
  invalidateTenantConfig,
};
