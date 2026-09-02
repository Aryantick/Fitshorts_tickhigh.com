const usersRepository = require("../users/users.repository");
const clientService = require("../client/client.service");
const subscriptionRepository = require("../subscription/subscription.repository");
const authRepository = require("./auth.repository");
const telecomConfigService = require("../telecomConfig/telecomConfig.service");
const telecomFactory = require("../../integrations/telecom/telecomFactory");
const DialogSLProvider = require("../../integrations/telecom/providers/dialogsl.provider");
const { generateAccessToken, generateRefreshToken } = require("../../utils/jwt");
const bcrypt = require("bcrypt");

/**
 * Verifies Encrypted MSISDN with Dialog SL Gateway and syncs user state in DB
 */
async function syncDialogUser(encryptedMsisdn, clientId = 3) {
  if (!encryptedMsisdn) {
    throw new Error("encryptedMsisdn is required");
  }

  // 1. Resolve Telecom Provider
  let provider;
  try {
    const telecomConfig = await telecomConfigService.getTelecomConfigByClientId(clientId);
    provider = telecomFactory.getTelecomProvider(telecomConfig);
  } catch (e) {
    // Fallback to default DialogSLProvider instance
    provider = new DialogSLProvider({});
  }

  // 2. Check Encrypted MSISDN status with Dialog SL operator
  const checkRes = await provider.checkSub(encryptedMsisdn);

  if (!checkRes.success) {
    throw new Error(checkRes.message || "Encrypted MSISDN is not active on Dialog SL");
  }

  // 3. Find or Create User in users table
  let user = await usersRepository.findByMsisdn(encryptedMsisdn);
  let userId;

  if (!user) {
    const result = await usersRepository.createUser(encryptedMsisdn);
    userId = result.id;
  } else {
    userId = user.id;
  }

  // 4. Record user-client relation (is_active = 1)
  await clientService.recordUserClientRelation(userId, clientId);

  // 5. Upsert subscription state in DB
  try {
    await subscriptionRepository.upsertUserSubscription({
      userId,
      clientId,
      currentStatus: "active",
      subscriptionStatus: "active",
      engineTransactionId: `DIALOG_${Date.now()}`,
    });
  } catch (e) {
    console.error("upsertUserSubscription warning:", e.message);
  }

  // 6. Generate JWT Tokens
  const accessToken = generateAccessToken(userId, clientId);
  const refreshToken = generateRefreshToken(userId, clientId);

  const hashedToken = await bcrypt.hash(refreshToken, 10);
  const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await authRepository.createRefreshToken(userId, hashedToken, refreshExpiresAt);

  return {
    accessToken,
    refreshToken,
    user: {
      id: userId,
      encryptedMsisdn,
      clientId,
    },
  };
}

module.exports = {
  syncDialogUser,
};
