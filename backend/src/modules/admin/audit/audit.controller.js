const AuditService = require("./audit.service");
const apiResponse = require("../../../utils/apiResponse");

async function getAuditLogs(req, res) {
  try {
    const { admin_id, action, target_type, page, limit } = req.query;
    const result = await AuditService.getAuditLogs({
      adminId: admin_id,
      action,
      targetType: target_type,
      page: page || 1,
      limit: limit || 20,
    });
    return apiResponse(res, 200, "Audit logs fetched successfully", result);
  } catch (error) {
    return apiResponse(res, 400, error.message, null);
  }
}

module.exports = {
  getAuditLogs,
};
