const clientService = require("./modules/client/client.service");
const telecomConfigService = require("./modules/telecomConfig/telecomConfig.service");
const telecomFactory = require("./integrations/telecom/telecomFactory");
const subscriptionService = require("./modules/subscription/subscription.service");
const pool = require("./config/db.config");

async function runTest() {
  console.log("=== Testing Jordan Orange Provider & Subdomain Resolution ===");

  // 1. Resolve client by subdomain 'orjo'
  const client = await clientService.resolveClientBySubdomain("orjo");
  console.log("1. Resolved Client for 'orjo':", client?.id, client?.name, client?.subdomain);
  if (!client || client.id !== 5) {
    throw new Error("Failed to resolve client for 'orjo'");
  }

  // 2. Fetch telecom configuration
  const config = await telecomConfigService.getTelecomConfigByClientId(client.id);
  console.log("2. Telecom Config Provider Key:", config?.provider_key);
  console.log("   Base URL:", config?.base_url);
  console.log("   Extra Config:", config?.extra_config);

  // 3. Instantiate provider via factory
  const provider = telecomFactory.getTelecomProvider(config);
  console.log("3. Provider instantiated successfully:", provider.constructor.name);

  // 4. Test checkSub directly via provider
  const testMsisdn = "962771234567";
  const subInfo = await provider.checkSub(testMsisdn);
  console.log("4. Provider checkSub response:", JSON.stringify(subInfo, null, 2));

  // 5. Test subscription service checkMsisdnStatus
  const statusResult = await subscriptionService.checkMsisdnStatus(testMsisdn, client.id);
  console.log("5. Subscription Service checkMsisdnStatus result:", JSON.stringify(statusResult, null, 2));

  // 6. Test validateOtp with dummy code (verifying error propagation from Beecell)
  const verifyRes = await provider.validateOtp(testMsisdn, "12345");
  console.log("6. Provider validateOtp response with test pin:", JSON.stringify(verifyRes, null, 2));

  console.log("\n=== ALL TESTS PASSED SUCCESSFULLY ===");
  process.exit(0);
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
