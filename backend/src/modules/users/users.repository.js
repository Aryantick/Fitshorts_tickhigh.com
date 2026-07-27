const pool = require("../../config/db.config");

async function findByMsisdn(msisdn) {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE msisdn = ?',
    [msisdn]
  );
  return rows[0];
}

async function createUser(msisdn) {
  const [result] = await pool.query(
    'INSERT INTO users (msisdn) VALUES (?)',
    [msisdn]
  );
  return { id: result.insertId, msisdn };
}

module.exports = {
  findByMsisdn,
  createUser,
};