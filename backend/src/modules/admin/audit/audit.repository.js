const pool = require("../../../config/db.config");

async function createAuditLog({
  adminId,
  adminUsername,
  action,
  targetType,
  targetId = null,
  details = null,
  ipAddress = null,
}) {
  const detailsJson = details ? JSON.stringify(details) : null;
  const [result] = await pool.query(
    `INSERT INTO admin_audit_logs 
     (admin_id, admin_username, action, target_type, target_id, details, ip_address) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [adminId, adminUsername, action, targetType, targetId, detailsJson, ipAddress]
  );
  return result;
}

async function findAuditLogs({
  adminId = null,
  action = null,
  targetType = null,
  page = 1,
  limit = 20,
}) {
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.max(1, Math.min(100, Number(limit)));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  const params = [];

  if (adminId) {
    conditions.push("admin_id = ?");
    params.push(adminId);
  }

  if (action) {
    conditions.push("action = ?");
    params.push(action);
  }

  if (targetType) {
    conditions.push("target_type = ?");
    params.push(targetType);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const [countResult] = await pool.query(
    `SELECT COUNT(*) AS total FROM admin_audit_logs ${whereClause}`,
    params
  );
  const total = countResult[0] ? countResult[0].total : 0;

  const [logs] = await pool.query(
    `SELECT * FROM admin_audit_logs ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limitNum, offset]
  );

  return {
    logs,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum) || 1,
  };
}

module.exports = {
  createAuditLog,
  findAuditLogs,
};
