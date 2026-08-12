const telecomConfigService = require("../telecomConfig/telecomConfig.service");
const telecomFactory = require("../../integrations/telecom/telecomFactory");
const telecomMapper = require("../../integrations/telecom/telecom.mapper");
const clientService = require("../client/client.service");
const OtpDBRep = require("../otp/otp.repository");
const usersRepository = require("../users/users.repository");
const authRepository = require("../auth/auth.repository");
const { generateAccessToken, generateRefreshToken } = require("../../utils/jwt");
const bcrypt = require("bcrypt");

/**
 * Service: Send Auth OTP for Existing User Login
 * Triggers auth OTP via operator gateway and logs audit record in otp_requests (flow_type = 'auth')
 */
async function sendAuthOtp(msisdn, clientId = 1) {
  try {
    const telecomConfig = await telecomConfigService.getTelecomConfigByClientId(clientId);
    const provider = telecomFactory.getTelecomProvider(telecomConfig);

    const res = await provider.authOtpGenerate(msisdn);

    if (!telecomMapper.issuccess(res.responseCode)) {
      throw new Error("Failed to send OTP");
    }

    const expiresAt = new Date(Date.now() + 20 * 60 * 1000);

    // Store auth OTP request in DB for audit trail
    await OtpDBRep.createOtpRequest(msisdn, "auth", res.transactionId, expiresAt);

    return { msisdn, transactionId: res.transactionId };
  } catch (error) {
    console.error("sendAuthOtp error:", error.message);
    throw error;
  }
}

/**
 * Service: Verify Auth OTP for Existing User Login
 * Validates OTP with operator gateway, verifies existing user in DB, records tenant relation & generates JWT session tokens
 */
async function verifyAuthOtp(msisdn, otp, clientId = 1) {
  try {
    const telecomConfig = await telecomConfigService.getTelecomConfigByClientId(clientId);
    const provider = telecomFactory.getTelecomProvider(telecomConfig);

    const res = await provider.authOtpValidate(msisdn, otp);

    if (!telecomMapper.issuccess(res.responseCode)) {
      throw new Error("OTP verification failed");
    }

    // 1. Mark auth OTP request as verified in DB
    await OtpDBRep.updateOtpStatus(msisdn, "verified", "auth");

    // 2. Find existing user or auto-create in users table for verified active subscriber
    let user = await usersRepository.findByMsisdn(msisdn);
    let userId;

    if (!user) {
      const created = await usersRepository.createUser(msisdn);
      userId = created.id || created.insertId;
    } else {
      userId = user.id;
    }

    // 3. Record active user-client tenant relation
    await clientService.recordUserClientRelation(userId, clientId);

    // 4. Generate Access & Refresh JWT Tokens
    const accessToken = generateAccessToken(userId, clientId);
    const refreshToken = generateRefreshToken(userId, clientId);

    const hashedToken = await bcrypt.hash(refreshToken, 10);
    const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await authRepository.saveRefreshToken(userId, hashedToken, refreshExpiresAt);

    return {
      accessToken,
      refreshToken,
      user: { id: userId, msisdn },
    };
  } catch (error) {
    console.error("verifyAuthOtp error:", error.message);
    throw error;
  }
}

/**
 * Service: Unsubscribe User
 * Triggers unsubscription with operator telecom gateway, deactivates tenant relation & updates subscription status in DB
 */
async function unsubscribeUser(msisdn, clientId = 1) {
  try {
    const telecomConfig = await telecomConfigService.getTelecomConfigByClientId(clientId);
    const provider = telecomFactory.getTelecomProvider(telecomConfig);

    // Call operator unsubscription API safely
    try {
      await provider.unsubscription(msisdn);
    } catch (e) {
      console.error("Telecom unsubscription call warning:", e.message);
    }

    // Deactivate tenant relation and subscription state in local DB
    const user = await usersRepository.findByMsisdn(msisdn);
    if (user) {
      await clientService.deactivateUserClientRelation(user.id, clientId);
      const subscriptionRepository = require("../subscription/subscription.repository");
      try {
        await subscriptionRepository.updateSubscriptionStatus(user.id, clientId, "unsub", "inactive");
      } catch (e) {
        console.error("updateSubscriptionStatus warning:", e.message);
      }
    }

    return { msisdn, unsubscribed: true, userId: user ? user.id : null };
  } catch (error) {
    console.error("unsubscribeUser error:", error.message);
    throw error;
  }
}

module.exports = {
  sendAuthOtp,
  verifyAuthOtp,
  unsubscribeUser,
};