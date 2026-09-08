const AuthService = require("./auth.service");
const dialogAuthService = require("./dialogAuth.service");
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

// async function verifyDialogSync(req, res) {
//   const encryptedMsisdn = req.body.encryptedMsisdn || req.body.u || req.query.encryptedMsisdn || req.query.u;
//   const status = req.body.status || req.query.status;
//   const refId = req.body.refId || req.query.refId;
//   const omsource = req.body.omsource || req.query.omsource;
//   const ommedium = req.body.ommedium || req.query.ommedium;
//   const omcampaign = req.body.omcampaign || req.query.omcampaign;
//   const clientId = req.client ? req.client.id : 3;

//   if (!encryptedMsisdn) {
//     return apiResponse(res, 400, "encryptedMsisdn (or 'u') is required");
//   }

//   try {
//     const result = await dialogAuthService.syncDialogUser(encryptedMsisdn, clientId, {
//       status,
//       refId,
//       omsource,
//       ommedium,
//       omcampaign,
//     });

//     res.cookie("refreshToken", result.refreshToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
//     });

//     return apiResponse(res, 200, "User verified and synced successfully", {
//       accessToken: result.accessToken,
//       user: result.user,
//     });
//   } catch (error) {
//     console.error("verifyDialogSync Controller Error:", error.message);
//     return apiResponse(res, 400, error.message);
//   }
// }

module.exports = {
  refreshToken,
  logoutUser,
  // verifyDialogSync,
};