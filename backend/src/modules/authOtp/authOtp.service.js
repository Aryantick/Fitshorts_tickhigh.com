const telecomClient = require("../../integrations/telecom/telecom.client");
const telecomMapper = require("../../integrations/telecom/telecom.mapper");
const OtpDBRep = require("../otp/otp.repository");
const usersRepository = require("../users/users.repository");
const authRepository = require("../auth/auth.repository");
const { generateAccessToken, generateRefreshToken } = require("../../utils/jwt");
const bcrypt = require("bcrypt");

async function sendAuthOtp(msisdn) {
  try {
    const res = await telecomClient.authOtpGenerate(msisdn);

    if (!telecomMapper.issuccess(res.responseCode)) {
      throw new Error("Failed to send OTP");
    }

    const expiresAt = new Date(Date.now() + 20 * 60 * 1000);

    await OtpDBRep.createOtpRequest(msisdn, "auth", res.transactionId, expiresAt);

    return { msisdn, transactionId: res.transactionId };
  } catch (error) {
    console.error("sendAuthOtp error:", error.message);
    throw error;
  }
}

async function verifyAuthOtp(msisdn, otp) {
  try {
    const res = await telecomClient.authOtpValidate(msisdn, otp);

    if (!telecomMapper.issuccess(res.responseCode)) {
      throw new Error("OTP verification failed");
    }

    await OtpDBRep.updateOtpStatus(msisdn, "verified", "auth");

    const user = await usersRepository.findByMsisdn(msisdn);
    if (!user) {
      throw new Error("User not found. Please subscribe first.");
    }

    const userId = user.id;

    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

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

// Unsubscribe — telecom side cancel only, NOT related to login/logout
async function unsubscribeUser(msisdn) {
  try {
    const telecomRes = await telecomClient.Unsubscription(msisdn);

    if (!telecomMapper.issuccess(telecomRes.responseCode)) {
      throw new Error("Failed to unsubscribe on telecom side");
    }

    const user = await usersRepository.findByMsisdn(msisdn);
    if (!user) {
      throw new Error("User not found");
    }

    // TODO: user_subscriptions table ka status yahan update karna hai

    return { msisdn, unsubscribed: true };
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