const pool = require('../../config/db.config');

async function findUserByMsisdn(msisdn) {
  const [row] = await pool.query(
    'SELECT * FROM users WHERE msisdn = ?',
    [msisdn]
  );
  return row[0];
}

async function upsertUserSubscription({ userId, clientId, subServiceId, currentStatus, subscriptionStatus, engineTransactionId }) {
  if (!userId) return null;
  const [result] = await pool.query(
    `INSERT INTO user_subscriptions (user_id, client_id, sub_service_id, current_status, subscription_status, engine_transaction_id, last_checked_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [userId, clientId || 1, subServiceId || null, currentStatus || 'active', subscriptionStatus || 'active', engineTransactionId || null]
  );
  return result;
}

async function updateSubscriptionStatus(userId, clientId, currentStatus, subscriptionStatus = 'inactive') {
  if (!userId) return null;
  const [result] = await pool.query(
    `UPDATE user_subscriptions 
     SET current_status = ?, subscription_status = ?, updated_at = NOW() 
     WHERE user_id = ? AND (client_id = ? OR client_id IS NULL)`,
    [currentStatus, subscriptionStatus, userId, clientId || 1]
  );
  return result;
}

module.exports = {
  findUserByMsisdn,
  upsertUserSubscription,
  updateSubscriptionStatus,
};