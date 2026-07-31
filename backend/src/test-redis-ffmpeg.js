const RedisUtil = require("./utils/redis.util");
const ffmpeg = require("fluent-ffmpeg");

async function testRedisAndFFmpeg() {
  console.log("==========================================");
  console.log("1. TESTING REDIS REAL-TIME COUNTERS");
  console.log("==========================================");

  try {
    const tenantId = "client_a";
    const testReelId = 999;

    console.log(`-> Incrementing Views for Tenant: '${tenantId}', Reel ID: ${testReelId}...`);
    const newViews = await RedisUtil.incrementViewCount(tenantId, testReelId);
    console.log(`   Current Views in Redis: ${newViews}`);

    console.log(`-> Incrementing Likes for Tenant: '${tenantId}', Reel ID: ${testReelId}...`);
    const newLikes = await RedisUtil.incrementLikeCount(tenantId, testReelId);
    console.log(`   Current Likes in Redis: ${newLikes}`);

    console.log("-> Fetching Real-Time Stats from Redis...");
    const stats = await RedisUtil.getRealtimeStats(tenantId, testReelId);
    console.log("   Stats Result:", stats);

  } catch (err) {
    console.error("❌ Redis Test Failed:", err.message);
  }

  console.log("\n==========================================");
  console.log("2. TESTING FFMPEG SYSTEM INSTALLATION");
  console.log("==========================================");

  ffmpeg.getAvailableCodecs((err, codecs) => {
    if (err) {
      console.error("❌ FFmpeg check failed. Make sure FFmpeg is installed on your system.");
      console.error("   Error:", err.message);
    } else {
      console.log("✅ FFmpeg is installed and accessible!");
      console.log(`   Found ${Object.keys(codecs).length} available codecs (e.g. h264, aac).`);
    }

    // Gracefully exit Redis connection
    RedisUtil.redis.quit();
  });
}

testRedisAndFFmpeg();
