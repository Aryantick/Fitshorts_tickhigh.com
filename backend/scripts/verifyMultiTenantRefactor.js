const clientService = require("../src/modules/client/client.service");
const telecomConfigService = require("../src/modules/telecomConfig/telecomConfig.service");
const telecomFactory = require("../src/integrations/telecom/telecomFactory");
const { generateAccessToken, generateRefreshToken } = require("../src/utils/jwt");
const jwt = require("jsonwebtoken");
const JwtConfig = require("../src/config/jwt.config");
const authenticateUser = require("../src/middlewares/auth.middlewares");
const reelsRepo = require("../src/modules/reels/reels.repository");

async function runVerification() {
  console.log("=== Verification Starting ===");

  // 1. Verify Client Service
  const defaultClient = await clientService.resolveClientBySubdomain("backreel");
  console.log("Subdomain 'backreel' resolved to:", defaultClient ? defaultClient.name : "NULL");
  if (!defaultClient || defaultClient.id !== 1) {
    throw new Error("Failed: 'backreel' client resolution failed!");
  }

  const unknownClient = await clientService.resolveClientBySubdomain("unknown_tenant");
  console.log("Subdomain 'unknown_tenant' resolved to:", unknownClient);
  if (unknownClient !== null) {
    throw new Error("Failed: unknown tenant should resolve to null!");
  }

  // 2. Verify Telecom Config Service
  const config = await telecomConfigService.getTelecomConfigByClientId(1);
  console.log("Client 1 telecom config provider:", config.provider_key);
  console.log("Client 1 telecom extra_config:", config.extra_config);
  if (config.provider_key !== "ZAIN" || !config.extra_config.serviceId) {
    throw new Error("Failed: Telecom config resolution for client 1 failed!");
  }

  // 3. Verify Telecom Factory
  const provider = telecomFactory.getTelecomProvider(config);
  console.log("Telecom factory returned provider class:", provider.constructor.name);
  if (provider.constructor.name !== "ZainProvider") {
    throw new Error("Failed: Telecom factory did not return ZainProvider!");
  }

  // 4. Verify JWT Tenant Embedding & authenticateUser Cross-Check
  const token = generateAccessToken(42, 1);
  const decoded = jwt.verify(token, JwtConfig.accessSecret);
  console.log("JWT Payload:", decoded);
  if (decoded.userId !== 42 || decoded.clientId !== 1) {
    throw new Error("Failed: JWT payload does not contain expected userId and clientId!");
  }

  // Fake Express req/res for authenticateUser
  let authFailed = false;
  const mockReqMismatch = {
    headers: { authorization: `Bearer ${token}` },
    client: { id: 2 }, // Tenant ID mismatch (2 vs 1)
  };
  const mockResMismatch = {
    status: function (code) {
      if (code === 403) authFailed = true;
      return this;
    },
    json: function (data) {
      console.log("Tenant mismatch correctly rejected with HTTP 403:", data);
      return this;
    },
  };
  authenticateUser(mockReqMismatch, mockResMismatch, () => {});
  if (!authFailed) {
    throw new Error("Failed: Tenant mismatch in authenticateUser was not rejected!");
  }

  let authPassed = false;
  const mockReqMatch = {
    headers: { authorization: `Bearer ${token}` },
    client: { id: 1 }, // Tenant ID match
  };
  authenticateUser(mockReqMatch, {}, () => {
    authPassed = true;
  });
  if (!authPassed) {
    throw new Error("Failed: Matching tenant token was rejected by authenticateUser!");
  }
  console.log("JWT tenant cross-check passed successfully!");

  // 5. Verify Reels Repository client-scoped queries
  const feedReels = await reelsRepo.findFeedReels(1);
  console.log(`Feed reels count for client 1: ${feedReels.length}`);

  console.log("=== All Multi-Tenant Refactor Verifications Passed! ===");
  process.exit(0);
}

runVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
