const router = require('express').Router();
const OtpRouters = require("./otp.controller")

router.post("/otp/send", OtpRouters.sendOtp)
router.post('/otp/verify', OtpRouters.OtpVerify);
module.exports = router;