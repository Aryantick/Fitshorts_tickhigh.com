const AdminUsersService = require("./adminUsers.service");
const apiResponse = require("../../../utils/apiResponse");

async function getUsers(req, res) {
  try {
    const { client_id, search, is_blocked, page, limit } = req.query;
    const result = await AdminUsersService.getUsersList({
      clientId: client_id,
      search,
      isBlocked: is_blocked,
      page: page || 1,
      limit: limit || 10,
    });
    return apiResponse(res, 200, "Users fetched successfully", result);
  } catch (error) {
    return apiResponse(res, 400, error.message, null);
  }
}

async function getUserById(req, res) {
  try {
    const { id } = req.params;
    const user = await AdminUsersService.getUserDetails(id);
    return apiResponse(res, 200, "User details fetched successfully", user);
  } catch (error) {
    return apiResponse(res, 404, error.message, null);
  }
}

async function getUserReels(req, res) {
  try {
    const { id } = req.params;
    const { page, limit } = req.query;
    const reels = await AdminUsersService.getUserReels(id, page || 1, limit || 10);
    return apiResponse(res, 200, "User reels fetched successfully", reels);
  } catch (error) {
    return apiResponse(res, 400, error.message, null);
  }
}

async function toggleUserBlock(req, res) {
  try {
    const { id } = req.params;
    const { isBlocked, reason } = req.body;
    const adminId = req.admin.adminId;
    const adminUsername = req.admin.username;
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || null;

    if (isBlocked === undefined) {
      return apiResponse(res, 400, "isBlocked (boolean) is required", null);
    }

    const result = await AdminUsersService.setUserBlockStatus(
      id,
      Boolean(isBlocked),
      reason,
      adminId,
      adminUsername,
      ipAddress
    );
    return apiResponse(res, 200, result.message, result);
  } catch (error) {
    return apiResponse(res, 400, error.message, null);
  }
}

module.exports = {
  getUsers,
  getUserById,
  getUserReels,
  toggleUserBlock,
};
