const DashboardService = require("./dashboard.service");
const apiResponse = require("../../../utils/apiResponse");

async function getDashboardStats(req, res) {
  try {
    const { client_id, startDate, endDate, start_date, end_date } = req.query;
    const stats = await DashboardService.getDashboardStats({
      clientId: client_id,
      startDate: startDate || start_date || null,
      endDate: endDate || end_date || null,
    });
    return apiResponse(res, 200, "Dashboard stats fetched successfully", stats);
  } catch (error) {
    return apiResponse(res, 400, error.message, null);
  }
}

async function getClients(req, res) {
  try {
    const clients = await DashboardService.getClientsList();
    return apiResponse(res, 200, "Clients fetched successfully", clients);
  } catch (error) {
    return apiResponse(res, 400, error.message, null);
  }
}

module.exports = {
  getDashboardStats,
  getClients,
};
