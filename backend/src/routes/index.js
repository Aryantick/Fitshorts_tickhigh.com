const router = require("express").Router();
const subscriptionRoutes = require("../modules/subscription/subscription.routes");
const selectPlanRoutes = require("../modules/subscription/subscription.routes");
const otpRoutes = require("../modules/otp/otp.routes");
const authRoutes = require("../modules/auth/auth.routes");
const authOtp = require("../modules/authOtp/authOtp.router");
const authOtpVerify = require("../modules/authOtp/authOtp.router");
const usersRoutes = require("../users.router");
const unsubscribe = require("../modules/authOtp/authOtp.router");
const Reelurl = require("../modules/reels/reels.router");
const AdminRouter = require("../modules/admin/admin.router");
const notificationRouter = require("../modules/notifications/notifications.router");
const musicRouter = require("../modules/music/music.router");

router.use(subscriptionRoutes);
router.use(selectPlanRoutes);
router.use(otpRoutes);
router.use(authRoutes);
router.use(usersRoutes);
router.use(authOtp);
router.use(authOtpVerify);
router.use(unsubscribe);
router.use(Reelurl);
router.use(AdminRouter);
router.use(notificationRouter);
router.use(musicRouter);

module.exports = router;
