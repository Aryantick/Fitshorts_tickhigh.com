const router = require('express').Router();
const OtpRouters = require("./otp.controller");
const validate = require("../../middlewares/validate.middleware");
const { sendOtpSchema, verifyOtpSchema } = require("../../validations/auth.validation");

router.post("/otp/send", validate(sendOtpSchema), OtpRouters.sendOtp);
router.post('/otp/verify', validate(verifyOtpSchema), OtpRouters.OtpVerify);
module.exports = router;