const apiResponse = require("./utils/apiResponse");

async function getMe(req, res) {
  return apiResponse(res, 200, "Profile fetched", { userId: req.user.userId });
}

module.exports = {
  getMe,
};