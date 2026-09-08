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

const usersRepository = require("../users/users.repository");
const clientService = require("../client/client.service");
const subscriptionRepository = require("./subscription.repository");
const authRepository = require("../auth/auth.repository");
const { generateAccessToken, generateRefreshToken } = require("../../utils/jwt");
const bcrypt = require("bcrypt");

/**
 * Service: Handle Dialog Sri Lanka Callback Flow
 * Find/Create User, Record Relation, Upsert Subscription, and Handle Authentication based on Status
 */
async function handleDialogCallback(params = {}, clientId = 3) {
  const { u, status, userAuthenticated, refId } = params;

  if (!u || !String(u).trim()) {
    throw new Error("Missing Dialog user identifier");
  }

  const normalizedStatus = String(status || "").trim().toUpperCase();
  const isUserAuthenticated = String(userAuthenticated || "").trim().toLowerCase() === "true";

  // 1. Find or Create User in Reel Backend users table
  let user = await usersRepository.findByMsisdn(u);
  if (!user) {
    const result = await usersRepository.createUser(u);
    user = { id: result.id, msisdn: u };
  }

  // 2. Record user-client relation (is_active = 1)
  await clientService.recordUserClientRelation(user.id, clientId);

  // 3. Process Subscription & Auth according to normalizedStatus


  if (normalizedStatus === "SUCCESS" || normalizedStatus === "PENDING") {
    try {
      await subscriptionRepository.upsertUserSubscription({
        userId: user.id,
        clientId,
        currentStatus: "active",
        subscriptionStatus: "active",
        engineTransactionId: refId ? `DIALOG_${refId}` : `DIALOG_${Date.now()}`,
      });
    } catch (e) {
      console.error("upsertUserSubscription warning:", e.message);
    }

    if (isUserAuthenticated) {
      const accessToken = generateAccessToken(user.id, clientId);
      const refreshToken = generateRefreshToken(user.id, clientId);

      const hashedToken = await bcrypt.hash(refreshToken, 10);
      const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await authRepository.saveRefreshToken(user.id, hashedToken, refreshExpiresAt);

      return {
        status: "SUCCESS",
        authenticated: true,
        accessToken,
        refreshToken,
        message: "Subscription active and user authenticated",
        user: {
          id: user.id,
          encryptedMsisdn: u,
          clientId,
        },
      };
    }

    return {
      status: "SUCCESS",
      authenticated: false,
      nextStep: "AUTHENTICATION_REQUIRED",
      message: "User authentication is required",
      user: {
        id: user.id,
        encryptedMsisdn: u,
        clientId,
      },
    };
  }

  throw new Error("Unsupported subscription status");
}

module.exports = {
  checkMsisdnStatus,
  validatePlan,
  initiateDialogSubscribe,
  handleDialogCallback,
};
