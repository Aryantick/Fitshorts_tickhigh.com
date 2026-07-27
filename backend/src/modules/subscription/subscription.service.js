const telecomClient = require("../../integrations/telecom/telecom.client");
const telecomMapper = require("../../integrations/telecom/telecom.mapper");

async function checkMsisdnStatus(msisdn, serviceId) {
  try {
    const res = await telecomClient.checksub(msisdn, serviceId);

    if (!telecomMapper.issuccess(res.responseCode)) {
      throw new Error("Telecom check failed");
    }

    const currentStatus = res.data.currentStatus;
    const subscriptionStatus = res.data.subscriptionStatus;
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
