const router = require('express').Router();
const authOtpController = require('./authOtp.controller');

router.post('/auth-otp/send', authOtpController.sendOtp);
router.post('/auth-otp/verify', authOtpController.verifyOtp);
router.post("/unsubscribe", authOtpController.UnsubscribeUser);

module.exports = router;