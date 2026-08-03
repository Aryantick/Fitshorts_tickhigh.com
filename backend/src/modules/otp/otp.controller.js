const otpService = require("./otp.service");
const apiResponse = require("../../utils/apiResponse");

async function sendOtp(req, res) {
  const { msisdn, subServiceId } = req.body || {};
  if (!msisdn || !subServiceId) {
    return apiResponse(res, 400, "msisdn and subServiceId are required");
  }

  try {
    const clientId = req.client ? req.client.id : 1;
    const result = await otpService.sendSubscribeOtp(msisdn, subServiceId, clientId);
    return apiResponse(res, 200, "OTP sent successfully", result);
  } catch (error) {
    return apiResponse(res, 400, error.message);
  }
}

async function OtpVerify(req, res) {
  const { msisdn, otp } = req.body || {};
  if (!msisdn || !otp) {
    return apiResponse(res, 400, "Msisdn & OTP are required");
  }

  try {
    const clientId = req.client ? req.client.id : 1;
    const result = await otpService.verifySubscribeOtp(msisdn, otp, clientId);

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: false,
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

module.exports = { sendOtp, OtpVerify };