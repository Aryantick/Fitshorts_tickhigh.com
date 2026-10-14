const LeaderboardService = require("./leaderboard.service");
const apiResponse = require("../../../utils/apiResponse");

async function getLeaderboard(req, res) {
  try {
    const { period, client_id, limit } = req.query;
    const result = await LeaderboardService.getLeaderboard({
      period: period || "all_time",
      clientId: client_id,
      limit: limit || 20,
    });
    return apiResponse(res, 200, "Leaderboard fetched successfully", result);
  } catch (error) {
    return apiResponse(res, 400, error.message, null);
  }
}

module.exports = {
  getLeaderboard,
};
