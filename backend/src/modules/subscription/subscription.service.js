const telecomConfigService = require("../telecomConfig/telecomConfig.service");
const telecomFactory = require("../../integrations/telecom/telecomFactory");
const telecomMapper = require("../../integrations/telecom/telecom.mapper");

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

const validPlans = ["FDaily", "FWeekly", "FMonthly"];

function validatePlan(msisdn, subServiceId) {
  if (!validPlans.includes(subServiceId)) {
    throw new Error("Invalid plan selected");
  }
  return {
    msisdn,
    subServiceId,
    message: "Plan selected successfully",
  };
}

module.exports = {
  checkMsisdnStatus,
  validatePlan,
};
