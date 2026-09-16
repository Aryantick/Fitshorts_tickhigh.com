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
  const effectiveClientId = clientId || 1;

  const [existing] = await pool.query(
    `SELECT id FROM user_subscriptions WHERE user_id = ? AND client_id = ? ORDER BY id DESC LIMIT 1`,
    [userId, effectiveClientId]
  );

  if (existing && existing.length > 0) {
    const [result] = await pool.query(
      `UPDATE user_subscriptions 
       SET current_status = ?, 
           subscription_status = ?, 
           sub_service_id = COALESCE(?, sub_service_id),
           engine_transaction_id = COALESCE(?, engine_transaction_id), 
           last_checked_at = NOW(), 
           updated_at = NOW()
       WHERE id = ?`,
      [
        currentStatus || 'active', 
        subscriptionStatus || 'active', 
        subServiceId || null,
        engineTransactionId || null, 
        existing[0].id
      ]
    );
    return result;
  }

  const [result] = await pool.query(
    `INSERT INTO user_subscriptions (user_id, client_id, sub_service_id, current_status, subscription_status, engine_transaction_id, last_checked_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [userId, effectiveClientId, subServiceId || null, currentStatus || 'active', subscriptionStatus || 'active', engineTransactionId || null]
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