const S3Client = require("../../integrations/s3/s3.client");
const ReelsRepository = require("./reels.repository");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const MusicService = require("../music/music.service");
const reelTranscodeQueue = require("../../queues/reelTranscode.queue");
const RedisUtil = require("../../utils/redis.util");

async function getUploadUrl(userId, fileExtension) {
  try {
    const result = await S3Client.generateUploadUrl(userId, fileExtension);
    return result;
  } catch (error) {
    console.error("getUploadUrl error:", error.message);
    throw new Error("Failed to generate upload URL");
  }
}

async function createReel(userId, title, description, rawS3Key, category, musicId) {
  try {
    const result = await ReelsRepository.createReel(
      userId,
      title,
      description,
      rawS3Key,
      category,
      musicId,
    );

    if (musicId) {
      try {
        await MusicService.incrementUsageCount(musicId);
      } catch (musicError) {
        console.error("Failed to increment music usage count:", musicError.message);
      }
    }

    try {
      await reelTranscodeQueue.add({
        reelId: result.insertId,
        s3Key: rawS3Key,
      });
    } catch (queueError) {
      console.error("Failed to add reel to transcode queue:", queueError.message);
    }

    return {
      reelId: result.insertId,
      status: "pending_review",
    };
  } catch (error) {
    console.error("createReel error:", error.message);
    throw new Error("Failed to create reel");
  }
}

async function getFeed(tenantId = "default") {
  try {
    const reels = await ReelsRepository.findFeedReels();

    const reelsWithUrls = await Promise.all(
      reels.map(async (reel) => {
        const videoKey = reel.hls_s3_key || reel.raw_s3_key;

        const videoUrl = await getSignedUrl(
          S3Client.s3Client,
          new GetObjectCommand({
            Bucket: S3Client.bucketName,
            Key: videoKey,
          }),
          { expiresIn: 3600 },
        );

        let thumbUrl = null;
        if (reel.thumb_s3_key) {
          thumbUrl = await getSignedUrl(
            S3Client.s3Client,
            new GetObjectCommand({
              Bucket: S3Client.bucketName,
              Key: reel.thumb_s3_key,
            }),
            { expiresIn: 3600 },
          );
        }

        // Merge Real-Time Redis counters
        const realtimeStats = await RedisUtil.getRealtimeStats(tenantId, reel.id);

        return {
          ...reel,
          videoUrl,
          thumbUrl,
          view_count: Math.max(reel.view_count || 0, realtimeStats.views),
          like_count: Math.max(reel.like_count || 0, realtimeStats.likes),
        };
      }),
    );

    return reelsWithUrls;
  } catch (error) {
    console.error("getFeed error:", error.message);
    throw new Error("Failed to fetch reel");
  }
}

async function getReelById(id, tenantId = "default") {
  try {
    const reel = await ReelsRepository.findReelById(id);
    if (!reel) {
      throw new Error("Reel not found");
    }
    const videoKey = reel.hls_s3_key || reel.raw_s3_key;
    const videoUrl = await getSignedUrl(
      S3Client.s3Client,
      new GetObjectCommand({
        Bucket: S3Client.bucketName,
        Key: videoKey,
      }),
      { expiresIn: 3600 },
    );

    let thumbUrl = null;
    if (reel.thumb_s3_key) {
      thumbUrl = await getSignedUrl(
        S3Client.s3Client,
        new GetObjectCommand({
          Bucket: S3Client.bucketName,
          Key: reel.thumb_s3_key,
        }),
        { expiresIn: 3600 },
      );
    }

    const realtimeStats = await RedisUtil.getRealtimeStats(tenantId, id);

    return {
      ...reel,
      videoUrl,
      thumbUrl,
      view_count: Math.max(reel.view_count || 0, realtimeStats.views),
      like_count: Math.max(reel.like_count || 0, realtimeStats.likes),
    };
  } catch (error) {
    console.error("getReelById error:", error.message);
    throw error;
  }
}

async function deleteReel(id, userId) {
  try {
    const reel = await ReelsRepository.findReelById(id);
    if (!reel) {
      throw new Error("Reel not found");
    }
    if (reel.user_id !== userId) {
      throw new Error("You are not authorized to delete this reel");
    }
    await ReelsRepository.deleteReelById(id);
    return {
      message: "Reel deleted successfully",
    };
  } catch (error) {
    console.error("deleteReel error:", error.message);
    throw error;
  }
}

async function likeReel(reelId, userId, tenantId = "default") {
  try {
    await ReelsRepository.addLike(reelId, userId);
    // Atomic increment in Redis for instant feedback
    const newCount = await RedisUtil.incrementLikeCount(tenantId, reelId);

    return {
      success: true,
      message: "Reel liked successfully",
      likeCount: newCount,
    };
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      throw new Error("Already liked");
    }
    throw error;
  }
}

async function unlikeReel(reelId, userId, tenantId = "default") {
  try {
    const result = await ReelsRepository.removeLike(reelId, userId);
    if (result.affectedRows === 0) {
      throw new Error("Reel is not liked by the user.");
    }

    // Atomic decrement in Redis
    const newCount = await RedisUtil.decrementLikeCount(tenantId, reelId);

    return {
      success: true,
      message: "Reel unliked successfully.",
      likeCount: newCount,
    };
  } catch (error) {
    throw error;
  }
}

async function recordView(reelId, userId, watchDuration, tenantId = "default") {
  try {
    await ReelsRepository.addView(reelId, userId, watchDuration);
    // Atomic increment in Redis
    const newCount = await RedisUtil.incrementViewCount(tenantId, reelId);

    return {
      counted: true,
      message: "View counted",
      viewCount: newCount,
    };
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return {
        counted: false,
        message: "View already recorded for this user",
      };
    }
    console.error("recordView error:", error.message);
    throw error;
  }
}

async function updateReelMetadata(id, userId, updates) {
  try {
    const reel = await ReelsRepository.findReelById(id);
    if (!reel) {
      throw new Error("Reel not found");
    }
    if (reel.user_id !== userId) {
      throw new Error("You are not authorized to edit this reel");
    }

    await ReelsRepository.updateReelMetadata(id, updates);
    const updatedReel = await ReelsRepository.findReelById(id);
    return updatedReel;
  } catch (error) {
    console.error("updateReel error:", error.message);
    throw error;
  }
}

async function getMyReels(userId) {
  try {
    const reels = await ReelsRepository.findReelsByUserId(userId);
    return reels;
  } catch (error) {
    console.error("getMyReels error:", error.message);
    throw error;
  }
}

module.exports = {
  getUploadUrl,
  createReel,
  getFeed,
  getReelById,
  deleteReel,
  likeReel,
  unlikeReel,
  recordView,
  updateReelMetadata,
  getMyReels
};