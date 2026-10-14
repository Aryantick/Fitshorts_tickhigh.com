const ModerationService = require("./moderation.service");
const apiResponse = require("../../../utils/apiResponse");

async function getReels(req, res) {
  try {
    const { status, client_id, category_id, search, page, limit } = req.query;
    const result = await ModerationService.getReelsList({
      status: status || "all",
      clientId: client_id,
      categoryId: category_id,
      search,
      page: page || 1,
      limit: limit || 10,
    });
    return apiResponse(res, 200, "Reels fetched successfully", result);
  } catch (error) {
    return apiResponse(res, 400, error.message, null);
  }
}

async function getReelById(req, res) {
  try {
    const { id } = req.params;
    const reel = await ModerationService.getReelDetails(id);
    return apiResponse(res, 200, "Reel details fetched successfully", reel);
  } catch (error) {
    return apiResponse(res, 404, error.message, null);
  }
}

async function getRejectionReasons(req, res) {
  try {
    const reasons = ModerationService.getRejectionReasons();
    return apiResponse(res, 200, "Rejection reasons fetched successfully", reasons);
  } catch (error) {
    return apiResponse(res, 400, error.message, null);
  }
}

async function approveReel(req, res) {
  try {
    const { id } = req.params;
    const adminId = req.admin.adminId;
    const adminUsername = req.admin.username;
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || null;

    const result = await ModerationService.approveReel(id, adminId, adminUsername, ipAddress);
    return apiResponse(res, 200, "Reel approved and published live successfully", result);
  } catch (error) {
    return apiResponse(res, 400, error.message, null);
  }
}

async function rejectReel(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.admin.adminId;
    const adminUsername = req.admin.username;
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || null;

    if (!reason) {
      return apiResponse(res, 400, "Rejection reason is required", null);
    }

    const result = await ModerationService.rejectReel(id, adminId, reason, adminUsername, ipAddress);
    return apiResponse(res, 200, "Reel rejected successfully", result);
  } catch (error) {
    return apiResponse(res, 400, error.message, null);
  }
}

async function suspendReel(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.admin.adminId;
    const adminUsername = req.admin.username;
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || null;

    const result = await ModerationService.suspendReel(id, adminId, reason || "Suspended by admin", adminUsername, ipAddress);
    return apiResponse(res, 200, "Reel suspended from feed successfully", result);
  } catch (error) {
    return apiResponse(res, 400, error.message, null);
  }
}

async function deleteReel(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.admin.adminId;
    const adminUsername = req.admin.username;
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || null;

    const result = await ModerationService.deleteReel(id, adminId, reason || "Deleted by admin", adminUsername, ipAddress);
    return apiResponse(res, 200, "Reel permanently deleted successfully", result);
  } catch (error) {
    return apiResponse(res, 400, error.message, null);
  }
}

module.exports = {
  getReels,
  getReelById,
  getRejectionReasons,
  approveReel,
  rejectReel,
  suspendReel,
  deleteReel,
};
