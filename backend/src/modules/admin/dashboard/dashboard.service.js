const DashboardRepository = require("./dashboard.repository");

async function getDashboardStats({ clientId = null, startDate = null, endDate = null } = {}) {
  return await DashboardRepository.getDashboardStats({ clientId, startDate, endDate });
}

async function getClientsList() {
  return await DashboardRepository.findAllClients();
}

module.exports = {
  getDashboardStats,
  getClientsList,
};
