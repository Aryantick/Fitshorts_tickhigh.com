const S3Client = require("../../integrations/s3/s3.client");
const ReelsRepository = require("./reels.repository");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const MusicService = require("../music/music.service");
const reelTranscodeQueue = require("../../queues/reelTranscode.queue");
const RedisUtil = require("../../utils/redis.util");

async function getUploadUrl(userId, fileExtension, clientId = 1) {
  try {
    const result = await S3Client.generateUploadUrl(userId, fileExtension, clientId);
    return result;
  } catch (error) {
    console.error("getUploadUrl error:", error.message);
    throw new Error("Failed to generate upload URL");
  }
}

async function createReel(userId, title, description, rawS3Key, category, musicId, clientId = 1) {
  try {
    const result = await ReelsRepository.createReel(
      userId,
      title,
      description,
      rawS3Key,
      category,
      musicId,
      clientId
    );

    if (musicId) {
      try {
        await MusicService.incrementUsageCount(musicId);
      } catch (musicError) {
        console.error("Failed to increment music usage count:", musicError.message);
      }
    }

    const worker = require("../../workers/reelTranscode.worker");
    try {
      await reelTranscodeQueue.add({
        reelId: result.insertId,
        s3Key: rawS3Key,
        clientId,
      });
    } catch (queueError) {
      console.warn("[Queue Fallback] Redis offline. Processing transcoding directly:", queueError.message);
      setImmediate(() => {
        worker.processReelTranscodeDirectly({
          reelId: result.insertId,
          s3Key: rawS3Key,
          clientId,
        });
      });
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

async function getFeed(clientId = 1, page = 1, limit = 10) {
  try {
    const reels = await ReelsRepository.findFeedReels(clientId, page, limit);

    const reelsWithUrls = await Promise.all(
      reels.map(async (reel) => {
        const videoKey = reel.raw_s3_key || reel.hls_s3_key;
        let videoUrl = null;

        if (videoKey) {
          videoUrl = await getSignedUrl(
            S3Client.s3Client,
            new GetObjectCommand({
              Bucket: S3Client.bucketName,
              Key: videoKey,
            }),
            { expiresIn: 3600 }
          );
        }

        let thumbUrl = null;
        if (reel.thumb_s3_key) {
          thumbUrl = await getSignedUrl(
            S3Client.s3Client,
            new GetObjectCommand({
              Bucket: S3Client.bucketName,
              Key: reel.thumb_s3_key,
            }),
            { expiresIn: 3600 }
          );
        }

        let musicUrl = null;
        let musicTitle = null;
        let musicArtist = null;

        if (reel.music_id) {
          try {
            const musicTrack = await MusicService.getMusicById(reel.music_id);
            if (musicTrack && musicTrack.s3_key) {
              musicUrl = await getSignedUrl(
                S3Client.s3Client,
                new GetObjectCommand({
                  Bucket: S3Client.bucketName,
                  Key: musicTrack.s3_key,
                }),
                { expiresIn: 3600 }
              );
              musicTitle = musicTrack.title;
              musicArtist = musicTrack.artist;
            }
          } catch (musicErr) {
            console.warn("Failed to attach music audioUrl:", musicErr.message);
          }
        }

        // Merge Real-Time Redis counters using clientId
        const realtimeStats = await RedisUtil.getRealtimeStats(String(clientId), reel.id);

        return {
          ...reel,
          videoUrl,
          thumbUrl,
          music_url: musicUrl,
          music_title: musicTitle,
          music_artist: musicArtist,
          view_count: Math.max(reel.view_count || 0, realtimeStats.views),
          like_count: Math.max(reel.like_count || 0, realtimeStats.likes),
        };
      })
    );

    return reelsWithUrls;
  } catch (error) {
    console.error("getFeed error:", error.message);
    throw new Error("Failed to fetch reel");
  }
}

async function getReelById(id, clientId = 1) {
  try {
    const reel = await ReelsRepository.findReelById(id, clientId);
    if (!reel) {
      throw new Error("Reel not found");
    }
    const videoKey = reel.raw_s3_key || reel.hls_s3_key;
    const videoUrl = await getSignedUrl(
      S3Client.s3Client,
      new GetObjectCommand({
        Bucket: S3Client.bucketName,
        Key: videoKey,
      }),
      { expiresIn: 3600 }
    );

    let thumbUrl = null;
    if (reel.thumb_s3_key) {
      thumbUrl = await getSignedUrl(
        S3Client.s3Client,
        new GetObjectCommand({
          Bucket: S3Client.bucketName,
          Key: reel.thumb_s3_key,
        }),
        { expiresIn: 3600 }
      );
    }

    const realtimeStats = await RedisUtil.getRealtimeStats(String(clientId), id);

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

async function deleteReel(id, userId, clientId = 1) {
  try {
    const reel = await ReelsRepository.findReelById(id, clientId);
    if (!reel) {
      throw new Error("Reel not found");
    }
    if (reel.user_id !== userId) {
      throw new Error("You are not authorized to delete this reel");
    }
    await ReelsRepository.deleteReelById(id, clientId);
    return {
      message: "Reel deleted successfully",
    };
  } catch (error) {
    console.error("deleteReel error:", error.message);
    throw error;
  }
}

async function likeReel(reelId, userId, clientId = 1) {
  try {
    const reel = await ReelsRepository.findReelById(reelId, clientId);
    if (!reel) {
      throw new Error("Reel not found");
    }
    await ReelsRepository.addLike(reelId, userId);
    const newCount = await RedisUtil.incrementLikeCount(String(clientId), reelId);

    return {
      success: true,
      message: "Reel liked successfully",
      likeCount: newCount,
    };
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return {
        success: true,
        message: "Already liked",
      };
    }
    throw error;
  }
}

async function unlikeReel(reelId, userId, clientId = 1) {
  try {
    const reel = await ReelsRepository.findReelById(reelId, clientId);
    if (!reel) {
      throw new Error("Reel not found");
    }
    const result = await ReelsRepository.removeLike(reelId, userId);
    let newCount = 0;
    if (result.affectedRows > 0) {
      newCount = await RedisUtil.decrementLikeCount(String(clientId), reelId);
    }

    return {
      success: true,
      message: "Reel unliked successfully",
      likeCount: newCount,
    };
  } catch (error) {
    console.error("unlikeReel error:", error.message);
    throw error;
  }
}

async function recordView(reelId, userId, watchDuration, clientId = 1) {
  try {
    const reel = await ReelsRepository.findReelById(reelId, clientId);
    if (!reel) {
      throw new Error("Reel not found");
    }
    await ReelsRepository.addView(reelId, userId, watchDuration);
    // Atomic increment in Redis
    const newCount = await RedisUtil.incrementViewCount(String(clientId), reelId);

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

async function updateReelMetadata(id, userId, updates, clientId = 1) {
  try {
    const reel = await ReelsRepository.findReelById(id, clientId);
    if (!reel) {
      throw new Error("Reel not found");
    }
    if (reel.user_id !== userId) {
      throw new Error("You are not authorized to edit this reel");
    }

    await ReelsRepository.updateReelMetadata(id, clientId, updates);
    const updatedReel = await ReelsRepository.findReelById(id, clientId);
    return updatedReel;
  } catch (error) {
    console.error("updateReel error:", error.message);
    throw error;
  }
}

async function getMyReels(userId, clientId = 1) {
  try {
    const reels = await ReelsRepository.findReelsByUserId(userId, clientId);
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
  getMyReels,
};