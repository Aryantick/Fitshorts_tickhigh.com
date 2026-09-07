const router = require('express').Router();
const subscribeController = require("./subscription.controller");

router.post('/msisdn/check', subscribeController.checkMsisdn);
router.post('/plan/select', subscribeController.selectPlan);

module.exports = router;