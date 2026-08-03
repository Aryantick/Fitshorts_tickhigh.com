const authOtpService = require("./authOtp.service");
const apiResponse = require("../../utils/apiResponse");

async function sendOtp(req, res) {
  const { msisdn } = req.body || {};
  if (!msisdn) {
    return apiResponse(res, 400, "msisdn is required");
  }

  try {
    const clientId = req.client ? req.client.id : 1;
    const result = await authOtpService.sendAuthOtp(msisdn, clientId);
    return apiResponse(res, 200, "OTP sent successfully", result);
  } catch (error) {
    return apiResponse(res, 400, error.message);
  }
}

async function verifyOtp(req, res) {
  const { msisdn, otp } = req.body || {};
  if (!msisdn || !otp) {
    return apiResponse(res, 400, "msisdn and otp are required");
  }

  try {
    const clientId = req.client ? req.client.id : 1;
    const result = await authOtpService.verifyAuthOtp(msisdn, otp, clientId);

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return apiResponse(res, 200, "OTP verified successfully", {
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (error) {
    return apiResponse(res, 400, error.message);
  }
}

async function UnsubscribeUser(req, res) {
  const { msisdn } = req.body || {};
  if (!msisdn) {
    return apiResponse(res, 400, "Msisdn is required");
  }

  try {
    const clientId = req.client ? req.client.id : 1;
    const result = await authOtpService.unsubscribeUser(msisdn, clientId);
    return apiResponse(res, 200, "Unsubscribed successfully", result);
  } catch (error) {
    return apiResponse(res, 400, error.message);
  }
}

module.exports = { sendOtp, verifyOtp, UnsubscribeUser };