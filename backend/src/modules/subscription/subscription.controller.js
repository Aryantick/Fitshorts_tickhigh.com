const Service = require("./subscription.service");
const apiResponse = require("../../utils/apiResponse");

/**
 * Controller: Check MSISDN Subscription Status (POST /api/msisdn/check)
 * Resolves current tenant, calls telecom gateway, and returns user status (active, new, pending, etc.)
 */
async function checkMsisdn(req, res) {
  const { msisdn } = req.body || {};

  if (!msisdn) {
    return apiResponse(res, 400, "msisdn is required");
  }

  try {
    const clientId = req.client ? req.client.id : 1;
    const result = await Service.checkMsisdnStatus(msisdn, clientId);
    return apiResponse(res, 200, "MSISDN status checked successfully", result);
  } catch (error) {
    return apiResponse(res, 500, error.message || "Something went wrong");
  }
}

/**
 * Controller: Select & Validate Plan (POST /api/plan/select)
 * Validates selected plan for tenant and syncs with operator subscription engine if required
 */
async function selectPlan(req, res) {
  const { msisdn, subServiceId } = req.body || {};
  if (!msisdn || !subServiceId) {
    return apiResponse(res, 400, "msisdn and subServiceId are required");
  }

  try {
    const clientId = req.client ? req.client.id : 1;
    const result = await Service.validatePlan(msisdn, subServiceId, clientId);
    return apiResponse(res, 200, "Plan validated successfully", result);
  } catch (error) {
    return apiResponse(res, 400, error.message);
  }
}

/**
 * Dialog SL Proxy: Initiate Subscribe
 */
async function dialogSubscribe(req, res) {
  try {
    const clientId = req.client ? req.client.id : 3;
    const result = await Service.initiateDialogSubscribe(clientId);
    return res.status(200).json(result.rawData || result);
  } catch (error) {
    return apiResponse(res, 500, error.message);
  }
}

/**
 * Dialog SL Proxy: Get Subscription Result
 */
async function dialogSubscriptionResult(req, res) {
  try {
    const clientId = req.client ? req.client.id : 3;
    const result = await Service.getDialogSubscriptionResult(req.query, clientId);
    return res.status(200).json(result.rawData || result);
  } catch (error) {
    return apiResponse(res, 500, error.message);
  }
}

/**
 * Dialog SL Proxy: Check Encrypted MSISDN Status
 */
async function dialogCheckEncryptedMsisdn(req, res) {
  const { encryptedMsisdn } = req.body || {};
  try {
    const clientId = req.client ? req.client.id : 3;
    const result = await Service.checkDialogEncryptedMsisdn(encryptedMsisdn, clientId);
    return res.status(200).json(result.rawData || result);
  } catch (error) {
    return apiResponse(res, 500, error.message);
  }
}

/**
 * Dialog SL Proxy: Unsubscribe User
 */
async function dialogUnsubscribe(req, res) {
  const { encryptedMsisdn } = req.body || {};
  try {
    const clientId = req.client ? req.client.id : 3;
    const result = await Service.unsubscribeDialog(encryptedMsisdn, clientId);
    return res.status(200).json(result.rawData || result);
  } catch (error) {
    return apiResponse(res, 500, error.message);
  }
}

module.exports = {
  checkMsisdn,
  selectPlan,
  dialogSubscribe,
  dialogSubscriptionResult,
  dialogCheckEncryptedMsisdn,
  dialogUnsubscribe,
};
