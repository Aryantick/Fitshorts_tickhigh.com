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

async function initiateDialogSubscription(req, res) {
  try {
    const clientId = req.client ? req.client.id : 3;
    const { source, medium, campaign } = req.body || {};
    const result = await Service.initiateDialogSubscribe(clientId, { source, medium, campaign });
    return apiResponse(res, 200, "Dialog subscription initiated successfully", result);
  } catch (error) {
    return apiResponse(res, 500, error.message || "Failed to initiate Dialog subscription");
  }
}

module.exports = {
  checkMsisdn,
  selectPlan,
  initiateDialogSubscription,
};
