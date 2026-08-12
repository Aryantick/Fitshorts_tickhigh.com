const pool = require("../../config/db.config");

/**
 * Finds user row in users table by MSISDN (phone number)
 */
async function findByMsisdn(msisdn) {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE msisdn = ?',
    [msisdn]
  );
  return rows[0];
}

/**
 * Creates new user row in users table
 */
async function createUser(msisdn) {
  const [result] = await pool.query(
    'INSERT INTO users (msisdn) VALUES (?)',
    [msisdn]
  );
  return { id: result.insertId, msisdn };
}

/**
 * Deactivates user in users table (sets is_active = 0)
 */
async function deactivateUser(userId) {
  const [result] = await pool.query(
    'UPDATE users SET is_active = 0 WHERE id = ?',
    [userId]
  );
  return result;
}

/**
 * Activates user in users table (sets is_active = 1)
 */
async function activateUser(userId) {
  const [result] = await pool.query(
    'UPDATE users SET is_active = 1 WHERE id = ?',
    [userId]
  );
  return result;
}

module.exports = {
  findByMsisdn,
  createUser,
  deactivateUser,
  activateUser,
};