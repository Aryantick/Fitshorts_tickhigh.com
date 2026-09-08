const router = require('express').Router();
const subscribeController = require("./subscription.controller");

router.post('/msisdn/check', subscribeController.checkMsisdn);
router.post('/plan/select', subscribeController.selectPlan);
// router.post('/subscription/dialog/initiate', subscribeController.initiateDialogSubscription);
router.get('/subscription/dialog/callback', subscribeController.handleDialogCallback);

module.exports = router;