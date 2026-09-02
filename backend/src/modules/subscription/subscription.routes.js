const router = require('express').Router();
const subscribeController = require("./subscription.controller");

router.post('/msisdn/check', subscribeController.checkMsisdn);
router.post('/plan/select', subscribeController.selectPlan);

// Dialog SL Proxy Routes
router.post('/v1/integration/subscribe', subscribeController.dialogSubscribe);
router.get('/v1/integration/subscription/result', subscribeController.dialogSubscriptionResult);
router.post('/v1/subscriptions/encrypt-msisdn', subscribeController.dialogCheckEncryptedMsisdn);
router.post('/v1/integration/unsubscribe', subscribeController.dialogUnsubscribe);

module.exports = router;