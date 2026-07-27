const router = require('express').Router();
const subscribeController = require("./subscription.controller");
const selectPlanRoutes = require("./subscription.controller");
router.post('/msisdn/check', subscribeController.checkMsisdn);
router.post('/plan/select', selectPlanRoutes.selectPlan);
module.exports = router;