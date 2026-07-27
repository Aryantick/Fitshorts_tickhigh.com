const telecomClient = require("../../integrations/telecom/telecom.client");
const telecomMapper = require("../../integrations/telecom/telecom.mapper");
const OtpDBRep = require("./otp.repository");
const usersRepository = require("../users/users.repository");
const authRepository = require("../auth/auth.repository");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../utils/jwt");
const bcrypt = require("bcrypt");

async function sendSubscribeOtp(msisdn, subServiceId) {
  try {
    const res = await telecomClient.subscribeOtp(msisdn, subServiceId);

    if (!telecomMapper.issuccess(res.responseCode)) {
      throw new Error("Failed to send OTP");
    }

    const expiresAt = new Date(Date.now() + 20 * 60 * 1000); // 20 min

    await OtpDBRep.createOtpRequest(
      msisdn,
      "subscribe",
      res.transactionId,
      expiresAt,
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

async function verifySubscribeOtp(msisdn, otp) {
  try {
    const res = await telecomClient.validateOtp(msisdn, otp);

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

    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

    const hashedToken = await bcrypt.hash(refreshToken, 10);
    const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await authRepository.saveRefreshToken(
      userId,
      hashedToken,
      refreshExpiresAt,
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
