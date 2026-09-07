const telecomConfigService = require("../telecomConfig/telecomConfig.service");
const telecomFactory = require("../../integrations/telecom/telecomFactory");
const telecomMapper = require("../../integrations/telecom/telecom.mapper");

/**
 * Service: Check MSISDN Status from Telecom Gateway
 * Resolves telecom provider for clientId and queries current subscription status (active, unsub, pending, etc.)
 */
async function checkMsisdnStatus(msisdn, clientId = 1) {
  try {
    const telecomConfig = await telecomConfigService.getTelecomConfigByClientId(clientId);
    const provider = telecomFactory.getTelecomProvider(telecomConfig);

    const res = await provider.checkSub(msisdn);

    if (!telecomMapper.issuccess(res.responseCode)) {
      throw new Error("Telecom check failed");
    }

    const currentStatus = res.data?.currentStatus;
    const subscriptionStatus = res.data?.subscriptionStatus;
    const nextStep = telecomMapper.resolveNextStep(currentStatus);

    return {
      currentStatus,
      subscriptionStatus,
      nextStep,
    };
  } catch (error) {
    console.error("checkMsisdnStatus error:", error.message);
    throw error;
  }
}

/**
 * Service: Validate Selected Plan & Sync with Operator
 * Checks allowed plans for current tenant and triggers operator sync if supported
 */
async function validatePlan(msisdn, subServiceId, clientId = 1) {
  if (!msisdn || !subServiceId || typeof subServiceId !== "string" || !subServiceId.trim()) {
    throw new Error("msisdn and valid subServiceId are required");
  }

  const telecomConfig = await telecomConfigService.getTelecomConfigByClientId(clientId);
  const extraConfig = telecomConfig?.extra_config || {};
  const allowedPlans = extraConfig.allowedPlans;

  // Validate subServiceId against client's configured allowed plans list
  if (Array.isArray(allowedPlans) && allowedPlans.length > 0) {
    if (!allowedPlans.includes(subServiceId.trim())) {
      throw new Error("Invalid plan selected for this client");
    }
  }

  // Trigger Provider Subscription Sync if supported (e.g. Orange /Subs_Engine/subscription/sync)
  try {
    const provider = telecomFactory.getTelecomProvider(telecomConfig);
    if (typeof provider.syncSubscription === "function") {
      await provider.syncSubscription(msisdn, subServiceId);
    }
  } catch (err) {
    console.error("syncSubscription error:", err.message);
  }

  return {
    msisdn,
    subServiceId,
    message: "Plan selected successfully",
  };
}

/**
 * Service: Initiate Dialog SL Gateway Subscription
 */
async function initiateDialogSubscribe(clientId = 3, options = {}) {
  let provider;
  try {
    const telecomConfig = await telecomConfigService.getTelecomConfigByClientId(clientId);
    provider = telecomFactory.getTelecomProvider(telecomConfig);
  } catch (e) {
    const DialogSLProvider = require("../../integrations/telecom/providers/dialogsl.provider");
    provider = new DialogSLProvider({});
  }

  const { source = "WEB", medium = "WEB", campaign = "WELLNESS360" } = options;
  return await provider.initiateSubscribe(source, medium, campaign);
}

module.exports = {
  checkMsisdnStatus,
  validatePlan,
  initiateDialogSubscribe,
};
