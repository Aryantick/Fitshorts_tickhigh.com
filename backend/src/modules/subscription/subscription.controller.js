const Service = require("./subscription.service");
const ApiResponse = require("../../utils/ApiResponse");
async function checkMsisdn(req, res) {
  const { msisdn } = req.body;

  if (!msisdn) {
    return ApiResponse(res, 400, "msisdn is required");
  }

  try {
    const result = await Service.checkMsisdnStatus(msisdn);
    return ApiResponse(res, 200, "MSISDN status checked successfully", result);
    res.json(result);
  } catch (error) {
    return ApiResponse(res, 500, "Something went wrong");
  }
}

async function selectPlan(req, res) {
  const { msisdn, subServiceId } = req.body;
  if (!msisdn || !subServiceId) {
    return ApiResponse(res, 400, "msisdn and subServiceId are required");
  }

  try {
    const result = await Service.validatePlan(msisdn, subServiceId);
    return ApiResponse(res, 200, "Plan validated successfully", result);
  } catch (error) {
    return ApiResponse(res, 400, error.message);
  }
}
module.exports = { checkMsisdn, selectPlan };
