const pool = require("../../config/db.config");

async function findConfigByClientId(clientId) {
  const [rows] = await pool.query(
    `SELECT tc.*, c.subdomain, c.name AS client_name 
     FROM telecom_configs tc
     LEFT JOIN clients c ON tc.client_id = c.id
     WHERE tc.client_id = ? AND tc.is_active = 1`,
    [clientId]
  );
  return rows[0] || null;
}

module.exports = {
  findConfigByClientId,
};
