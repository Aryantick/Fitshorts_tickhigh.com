const pool = require("../../config/db.config");

async function findBySubdomain(subdomain) {
  const [rows] = await pool.query("SELECT * FROM clients WHERE subdomain = ?", [subdomain]);
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.query("SELECT * FROM clients WHERE id = ?", [id]);
  return rows[0] || null;
}

async function createClient({ name, subdomain, countryCode = "SS" }) {
  const [result] = await pool.query(
    "INSERT INTO clients (name, subdomain, country_code) VALUES (?, ?, ?)",
    [name, subdomain, countryCode]
  );
  return result;
}

async function recordUserClientRelation(userId, clientId) {
  if (!userId || !clientId) return null;
  const [result] = await pool.query(
    `INSERT INTO user_client_relations (user_id, client_id, first_accessed_at, is_active)
     VALUES (?, ?, NOW(), 1)
     ON DUPLICATE KEY UPDATE is_active = 1`,
    [userId, clientId]
  );
  return result;
}

async function deactivateUserClientRelation(userId, clientId) {
  if (!userId || !clientId) return null;
  const [result] = await pool.query(
    `UPDATE user_client_relations SET is_active = 0 WHERE user_id = ? AND client_id = ?`,
    [userId, clientId]
  );
  return result;
}

module.exports = {
  findBySubdomain,
  findById,
  createClient,
  recordUserClientRelation,
  deactivateUserClientRelation,
};
