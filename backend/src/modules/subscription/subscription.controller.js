const Service = require("./subscription.service");
const apiResponse = require("../../utils/apiResponse");

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

async function selectPlan(req, res) {
  const { msisdn, subServiceId } = req.body || {};
  if (!msisdn || !subServiceId) {
    return apiResponse(res, 400, "msisdn and subServiceId are required");
  }

  try {
    const result = await Service.validatePlan(msisdn, subServiceId);
    return apiResponse(res, 200, "Plan validated successfully", result);
  } catch (error) {
    return apiResponse(res, 400, error.message);
  }
}

module.exports = { checkMsisdn, selectPlan };
