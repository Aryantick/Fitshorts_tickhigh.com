const AuthService = require("./auth.service");
const apiResponse = require("../../utils/apiResponse");

async function refreshToken(req, res) {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return apiResponse(res, 401, "No refresh token found");
  }

  try {
    const result = await AuthService.refreshAccessToken(refreshToken);
    return apiResponse(res, 200, "Token refreshed successfully", result);
  } catch (error) {
    return apiResponse(res, 401, error.message);
  }
}

async function logoutUser(req, res) {
  try {
    const userId = req.user.userId;
    await AuthService.logout(userId);

    res.clearCookie('refreshToken');

    return apiResponse(res, 200, "Logged out successfully");
  } catch (error) {
    return apiResponse(res, 400, error.message);
  }
}
module.exports = {
  refreshToken,
  logoutUser
};