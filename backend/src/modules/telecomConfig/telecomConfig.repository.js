const pool = require("../../config/db.config");

async function findConfigByClientId(clientId) {
  const [rows] = await pool.query(
    "SELECT * FROM telecom_configs WHERE client_id = ? AND is_active = 1",
    [clientId]
  );
  return rows[0] || null;
}

module.exports = {
  findConfigByClientId,
};
