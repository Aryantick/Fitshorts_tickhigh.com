const router = require('express').Router();
const authOtpController = require('./authOtp.controller');
const validate = require('../../middlewares/validate.middleware');
const { sendOtpSchema, verifyOtpSchema } = require('../../validations/auth.validation');

router.post('/auth-otp/send', validate(sendOtpSchema), authOtpController.sendOtp);
router.post('/auth-otp/verify', validate(verifyOtpSchema), authOtpController.verifyOtp);
router.post("/unsubscribe", validate(sendOtpSchema), authOtpController.UnsubscribeUser);

module.exports = router;