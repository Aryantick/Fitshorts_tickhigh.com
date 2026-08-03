const telecomConfigService = require("../telecomConfig/telecomConfig.service");
const telecomFactory = require("../../integrations/telecom/telecomFactory");
const telecomMapper = require("../../integrations/telecom/telecom.mapper");
const clientService = require("../client/client.service");
const OtpDBRep = require("../otp/otp.repository");
const usersRepository = require("../users/users.repository");
const authRepository = require("../auth/auth.repository");
const { generateAccessToken, generateRefreshToken } = require("../../utils/jwt");
const bcrypt = require("bcrypt");

async function sendAuthOtp(msisdn, clientId = 1) {
  try {
    const telecomConfig = await telecomConfigService.getTelecomConfigByClientId(clientId);
    const provider = telecomFactory.getTelecomProvider(telecomConfig);

    const res = await provider.authOtpGenerate(msisdn);

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

async function verifyAuthOtp(msisdn, otp, clientId = 1) {
  try {
    const telecomConfig = await telecomConfigService.getTelecomConfigByClientId(clientId);
    const provider = telecomFactory.getTelecomProvider(telecomConfig);

    const res = await provider.authOtpValidate(msisdn, otp);

    if (!telecomMapper.issuccess(res.responseCode)) {
      throw new Error("OTP verification failed");
    }

    await OtpDBRep.updateOtpStatus(msisdn, "verified", "auth");

    const user = await usersRepository.findByMsisdn(msisdn);
    if (!user) {
      throw new Error("User not found. Please subscribe first.");
    }

    const userId = user.id;

    // Record user-client relation
    await clientService.recordUserClientRelation(userId, clientId);

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

async function unsubscribeUser(msisdn, clientId = 1) {
  try {
    const telecomConfig = await telecomConfigService.getTelecomConfigByClientId(clientId);
    const provider = telecomFactory.getTelecomProvider(telecomConfig);

    const telecomRes = await provider.unsubscription(msisdn);

    if (!telecomMapper.issuccess(telecomRes.responseCode)) {
      throw new Error("Failed to unsubscribe on telecom side");
    }

    const user = await usersRepository.findByMsisdn(msisdn);
    if (!user) {
      throw new Error("User not found");
    }

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