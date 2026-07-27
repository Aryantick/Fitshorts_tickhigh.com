const pool = require("../../config/db.config");

async function createOtpRequest(msisdn, flowType, transactionId, expiresAt) {
  const [result] = await pool.query(
    "INSERT INTO otp_requests (msisdn, flow_type, transaction_id, status, expires_at) VALUES (?, ?, ?, ?, ?)",
    [msisdn, flowType, transactionId, "sent", expiresAt],
  );
  return result;
}

//

async function updateOtpStatus(msisdn, status, flowType) {
  const [result] = await pool.query(
    "UPDATE otp_requests SET status = ?, verified_at = NOW() WHERE msisdn = ? AND flow_type = ? ORDER BY id DESC LIMIT 1",
    [status, msisdn, flowType],
  );
  return result;
}

module.exports = {
  createOtpRequest,
  updateOtpStatus
};
