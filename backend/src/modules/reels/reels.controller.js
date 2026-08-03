const apiResponse = require("../../utils/apiResponse");
const ReelService = require("./reels.service");

async function getUploadUrl(req, res) {
  const { fileExtension } = req.query;
  const userId = req.user.userId;
  if (!fileExtension) {
    return apiResponse(res, 400, "fileExtension is required");
  }
  try {
    const result = await ReelService.getUploadUrl(userId, fileExtension);
    return apiResponse(res, 200, "Upload URL generated", result);
  } catch (error) {
    return apiResponse(res, 400, error.message);
  }
}

async function uploadReel(req, res) {
  const { title, description, rawS3Key, category, musicId } = req.body;
  const userId = req.user.userId;
  const clientId = req.client ? req.client.id : 1;

  if (!title || !rawS3Key) {
    return apiResponse(res, 400, "Title & rawS3key is required");
  }
  try {
    const result = await ReelService.createReel(
      userId,
      title,
      description,
      rawS3Key,
      category,
      musicId,
      clientId
    );

    return apiResponse(res, 200, "Reel created successfully", result);
  } catch (error) {
    return apiResponse(res, 400, error.message);
  }
}

async function getFeed(req, res) {
  try {
    const clientId = req.client ? req.client.id : 1;
    const result = await ReelService.getFeed(clientId);
    return apiResponse(res, 200, "Feed fetched successfully", result);
  } catch (error) {
    return apiResponse(res, 400, error.message);
  }
}

async function getReelById(req, res) {
  const { id } = req.params;
  if (!id) {
    return apiResponse(res, 400, "id is required");
  }
  try {
    const clientId = req.client ? req.client.id : 1;
    const result = await ReelService.getReelById(id, clientId);
    return apiResponse(res, 200, "Reel Fetched Successfully", result);
  } catch (error) {
    return apiResponse(res, 400, error.message);
  }
}

async function deleteReel(req, res) {
  const { id } = req.params;
  const userId = req.user.userId;
  const clientId = req.client ? req.client.id : 1;

  try {
    const result = await ReelService.deleteReel(id, userId, clientId);
    return apiResponse(res, 200, "Reel deleted successfully", result);
  } catch (error) {
    return apiResponse(res, 400, error.message);
  }
}

async function reelLike(req, res) {
  const { id: reelId } = req.params;
  const userId = req.user.userId;
  const clientId = req.client ? req.client.id : 1;

  try {
    const result = await ReelService.likeReel(reelId, userId, clientId);
    return apiResponse(res, 200, "Reel liked successfully", result);
  } catch (error) {
    console.error("reelLike error:", error.message);
    return apiResponse(res, 400, error.message);
  }
}

async function unlikeReel(req, res) {
  const { id: reelId } = req.params;
  const userId = req.user.userId;
  const clientId = req.client ? req.client.id : 1;

  try {
    const result = await ReelService.unlikeReel(reelId, userId, clientId);
    return apiResponse(res, 200, "Reel unliked successfully", result);
  } catch (error) {
    console.error("Unlike Reel Error:", error);

    if (error.message === "Reel is not liked by the user.") {
      return apiResponse(res, 400, error.message);
    }

    return apiResponse(res, 500, "Internal server error");
  }
}

async function recordView(req, res) {
  const { id: reelId } = req.params;
  const userId = req.user.userId;
  const { watchDuration } = req.body;
  const clientId = req.client ? req.client.id : 1;

  if (watchDuration === undefined || watchDuration < 3) {
    return apiResponse(res, 400, "Minimum 3 seconds watch time required");
  }

  try {
    const result = await ReelService.recordView(reelId, userId, watchDuration, clientId);
    return apiResponse(res, 200, "View recorded", result);
  } catch (error) {
    console.error("recordView error:", error.message);
    return apiResponse(res, 400, error.message);
  }
}

async function updateReelMetadata(req, res) {
  const { id } = req.params;
  const userId = req.user.userId;
  const { title, description, category } = req.body || {};
  const clientId = req.client ? req.client.id : 1;

  if (!title && !description && !category) {
    return apiResponse(res, 400, "At least one field is required to update");
  }

  try {
    const result = await ReelService.updateReelMetadata(id, userId, {
      title,
      description,
      category,
    }, clientId);
    return apiResponse(res, 200, "Reel updated successfully", result);
  } catch (error) {
    console.error("updateReel error:", error.message);
    return apiResponse(res, 400, error.message);
  }
}

async function getMyReels(req, res) {
  const userId = req.user.userId;
  const clientId = req.client ? req.client.id : 1;

  try {
    const result = await ReelService.getMyReels(userId, clientId);
    return apiResponse(res, 200, "Your reels fetched successfully", result);
  } catch (error) {
    console.error("getMyReels error:", error.message);
    return apiResponse(res, 400, error.message);
  }
}

module.exports = {
  getUploadUrl,
  uploadReel,
  recordView,
  deleteReel,
  getFeed,
  getReelById,
  reelLike,
  unlikeReel,
  updateReelMetadata,
  getMyReels,
};
