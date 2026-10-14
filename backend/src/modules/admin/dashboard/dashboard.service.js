const DashboardRepository = require("./dashboard.repository");

async function getDashboardStats(clientId = null) {
  const stats = await DashboardRepository.getDashboardStats(clientId);
  const clients = await DashboardRepository.findAllClients();

  return {
    ...stats,
    available_clients: clients,
  };
}

async function getClientsList() {
  return await DashboardRepository.findAllClients();
}

module.exports = {
  getDashboardStats,
  getClientsList,
};
