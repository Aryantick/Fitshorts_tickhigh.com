const AuditRepository = require("./audit.repository");

async function recordAuditLog(logData) {
  return await AuditRepository.createAuditLog(logData);
}

async function getAuditLogs(filters) {
  return await AuditRepository.findAuditLogs(filters);
}

module.exports = {
  recordAuditLog,
  getAuditLogs,
};
