const S3Client = require("../../integrations/s3/s3.client");
const ReelsRepository = require("./reels.repository");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const MusicService = require("../music/music.service")
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
      musicId
    );

    if (musicId) {
      try {
        await MusicService.incrementUsageCount(musicId)
      } catch (musicerror) {
        console.error("faild to increment music usage count", musicerror.message)
        throw error
      }
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

async function getFeed() {
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

        return { ...reel, videoUrl };
      }),
    );

    return reelsWithUrls;
  } catch (error) {
    console.error("getFeed error:", error.message);
    throw new Error("Failed to fetch reel");
  }
}

async function getReelById(id) {
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
    return { ...reel, videoUrl };
  } catch (error) {
    console.error("getReelById error:", error.message);
    throw error;
  }
}

async function deleteReel(id, userId) {
  try {
    const reel = await ReelsRepository.findReelById(id); // ✅ fixed: was findFeedReels(id)
    if (!reel) {
      throw new Error("Reel not found");
    }
    if (reel.user_id !== userId) { // ✅ fixed: was !reel.user_id === userId
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

async function likeReel(reelId, userId) {
  try {
    await ReelsRepository.addLike(reelId, userId);
    await ReelsRepository.incrementLikeCount(reelId);
    return {
      success: true,
      message: "Reel liked successfully",
    };
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      throw new Error("Already liked");
    }
    throw error;
  }
}

async function unlikeReel(reelId, userId) {
  try {
    const result = await ReelsRepository.removeLike(reelId, userId);
    if (result.affectedRows === 0) {
      throw new Error("Reel is not liked by the user.");
    }

    await ReelsRepository.decrementLikeCount(reelId);

    return {
      success: true,
      message: "Reel unliked successfully.",
    };
  } catch (error) {
    throw error;
  }
}

async function recordView(reelId, userId, watchDuration) {
  try {
    await ReelsRepository.addView(reelId, userId, watchDuration);
    await ReelsRepository.incrementViewCount(reelId);
    return {
      counted: true,
      message: "View counted",
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