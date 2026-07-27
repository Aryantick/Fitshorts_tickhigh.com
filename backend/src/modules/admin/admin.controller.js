const AdminService = require("./admin.service");
const apiResponse = require("../../utils/apiResponse");

async function Login(req, res) {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return apiResponse(res, 400, "identifier & password are required", null);
    }

    const result = await AdminService.loginAdmin(identifier, password);
    return apiResponse(res, 200, "Login successful", result);
  } catch (error) {
    return apiResponse(res, 400, error.message, error);
  }
}

async function createModerator(req, res) {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return apiResponse(
        res,
        400,
        "username email & password are required ",
        null,
      );
    }
    const result = await AdminService.createModerator(
      username,
      email,
      password,
    );
    return apiResponse(res, 200, "Moderator  created successfully", result);
  } catch (error) {
    return apiResponse(res, 400, error.message, error);
  }
}

async function findPendingReel(req, res) {
  try {
    const result = await AdminService.getPendingReels();
    return apiResponse(res, 200, "Pending reels fetched successfully", result);
  } catch (error) {
    return apiResponse(res, 400, error.message, error);
  }
}

async function approveReel(req, res) {
  try {
    const { id } = req.params;
    const adminId = req.admin.adminId;
    const result = await AdminService.approveReel(id, adminId);
    return apiResponse(res, 200, "reel approved successfully", result);
  } catch (error) {
    return apiResponse(res, 400, error.message, error);
  }
}

async function rejectedReel(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.admin.adminId;
    if (!reason) {
      return apiResponse(res, 400, "Rejection reason is required", null);
    }
    const result = await AdminService.rejectedReel(id, adminId, reason);
    return apiResponse(res, 200, "Reel Rejected successfully ", result);
  } catch (error) {
    return apiResponse(res, 400, error.message, error);
  }
}

async function deleteReel(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.admin.adminId;

    if (!reason) {
      return apiResponse(res, 400, "Deletion reason is required", null);
    }

    const result = await AdminService.deleteReel(id, adminId, reason);
    return apiResponse(res, 200, "Reel deleted successfully", result);
  } catch (error) {
    return apiResponse(res, 400, error.message, error);
  }
}
module.exports = {
  Login,
  createModerator,
  findPendingReel,
  approveReel,
  rejectedReel,
  deleteReel,
};
