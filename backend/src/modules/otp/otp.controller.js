const otpService = require("./otp.service");
const apiResponse = require("../../utils/apiResponse");

/**
 * Controller: Send Subscription OTP (POST /api/otp/send)
 * Triggers subscription OTP send request to the resolved tenant telecom gateway
 */
async function sendOtp(req, res) {
  const { msisdn, subServiceId } = req.body || {};
  if (!msisdn) {
    return apiResponse(res, 400, "msisdn is required");
  }

  try {
    const clientId = req.client ? req.client.id : 1;
    const effectiveSubServiceId = subServiceId || 1;
    const result = await otpService.sendSubscribeOtp(msisdn, effectiveSubServiceId, clientId);
    return apiResponse(res, 200, "OTP sent successfully", result);
  } catch (error) {
    return apiResponse(res, 400, error.message);
  }
}

/**
 * Controller: Verify Subscription OTP (POST /api/otp/verify)
 * Verifies OTP with telecom gateway, creates user, records client relation & subscription state, sets refresh cookie & returns JWT access token
 */
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