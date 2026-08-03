const telecomConfigService = require("../telecomConfig/telecomConfig.service");
const telecomFactory = require("../../integrations/telecom/telecomFactory");
const telecomMapper = require("../../integrations/telecom/telecom.mapper");
const clientService = require("../client/client.service");
const OtpDBRep = require("./otp.repository");
const usersRepository = require("../users/users.repository");
const authRepository = require("../auth/auth.repository");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../utils/jwt");
const bcrypt = require("bcrypt");

async function sendSubscribeOtp(msisdn, subServiceId, clientId = 1) {
  try {
    const telecomConfig = await telecomConfigService.getTelecomConfigByClientId(clientId);
    const provider = telecomFactory.getTelecomProvider(telecomConfig);

    const res = await provider.subscribeOtp(msisdn, subServiceId);

    if (!telecomMapper.issuccess(res.responseCode)) {
      throw new Error("Failed to send OTP");
    }

    const expiresAt = new Date(Date.now() + 20 * 60 * 1000); // 20 min

    await OtpDBRep.createOtpRequest(
      msisdn,
      "subscribe",
      res.transactionId,
      expiresAt
    );

    return {
      msisdn,
      transactionId: res.transactionId,
    };
  } catch (error) {
    console.error("sendSubscribeOtp error:", error.message);
    throw error;
  }
}

async function verifySubscribeOtp(msisdn, otp, clientId = 1) {
  try {
    const telecomConfig = await telecomConfigService.getTelecomConfigByClientId(clientId);
    const provider = telecomFactory.getTelecomProvider(telecomConfig);

    const res = await provider.validateOtp(msisdn, otp);

    if (!telecomMapper.issuccess(res.responseCode)) {
      throw new Error("OTP verification failed");
    }

    await OtpDBRep.updateOtpStatus(msisdn, "verified", "subscribe");

    let user = await usersRepository.findByMsisdn(msisdn);
    let userId;

    if (!user) {
      const result = await usersRepository.createUser(msisdn);
      userId = result.insertId;
    } else {
      userId = user.id;
    }

    // Find-or-create user_client_relations row
    await clientService.recordUserClientRelation(userId, clientId);

    const accessToken = generateAccessToken(userId, clientId);
    const refreshToken = generateRefreshToken(userId, clientId);

    const hashedToken = await bcrypt.hash(refreshToken, 10);
    const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await authRepository.saveRefreshToken(
      userId,
      hashedToken,
      refreshExpiresAt
    );

    return {
      accessToken,
      refreshToken,
      user: { id: userId, msisdn },
    };
  } catch (error) {
    console.error("verifySubscribeOtp error:", error.message);
    throw error;
  }
}

module.exports = {
  sendSubscribeOtp,
  verifySubscribeOtp,
};
