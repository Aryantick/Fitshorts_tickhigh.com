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

// async function initiateDialogSubscription(req, res) {
//   try {
//     const clientId = req.client ? req.client.id : 3;
//     const { source, medium, campaign } = req.body || {};
//     const result = await Service.initiateDialogSubscribe(clientId, { source, medium, campaign });
//     return apiResponse(res, 200, "Dialog subscription initiated successfully", result);
//   } catch (error) {
//     return apiResponse(res, 500, error.message || "Failed to initiate Dialog subscription");
//   }
// }

/**
 * Controller: Handle Dialog SL Callback (GET /api/subscription/dialog/callback)
 */
async function handleDialogCallback(req, res) {
  const {
    u,
    status,
    userAuthenticated,
    refId,
    opr,
    omsource,
    ommedium,
    omcampaign,
    encv,
  } = req.query || {};

  // 1. Validate required parameter `u`
  if (!u || !String(u).trim()) {
    return apiResponse(res, 400, "Missing Dialog user identifier");
  }

  // 2. Validate required callback parameters `status` and `userAuthenticated`
  if (
    status === undefined || status === null || String(status).trim() === "" ||
    userAuthenticated === undefined || userAuthenticated === null || String(userAuthenticated).trim() === ""
  ) {
    return apiResponse(res, 400, "Missing required callback parameters: status and userAuthenticated are required");
  }

  // 3. Normalize status and userAuthenticated
  const normalizedStatus = String(status || "").trim().toUpperCase();

  if (normalizedStatus !== "PENDING" && normalizedStatus !== "SUCCESS") {
    return apiResponse(res, 400, "Unsupported subscription status", {
      status: "UNKNOWN",
      authenticated: false,
    });
  }

  try {
    const clientId = req.client ? req.client.id : 3;
    const result = await Service.handleDialogCallback(
      {
        u: String(u).trim(),
        status,
        userAuthenticated,
        refId,
        opr,
        omsource,
        ommedium,
        omcampaign,
        encv,
      },
      clientId
    );

    if (result.refreshToken) {
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });
    }

    return apiResponse(res, 200, result.message || "Callback processed successfully", result);
  } catch (error) {
    return apiResponse(res, 400, error.message || "Failed to process Dialog callback");
  }
}

module.exports = {
  checkMsisdn,
  selectPlan,
  initiateDialogSubscription,
  handleDialogCallback,
};
