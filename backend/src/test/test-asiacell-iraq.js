const clientService = require("../modules/client/client.service");
const telecomConfigService = require("../modules/telecomConfig/telecomConfig.service");
const telecomFactory = require("../integrations/telecom/telecomFactory");
const subscriptionService = require("../modules/subscription/subscription.service");
const tenantResolver = require("../middlewares/tenantResolver.middleware");
const pool = require("../config/db.config");

async function runTest() {
  console.log("=== Testing Asiacell Iraq Provider & Subdomain Resolution ===");

  // 1. Resolve client by subdomain 'asiq'
  const client = await clientService.resolveClientBySubdomain("asiq");
  console.log("1. Resolved Client for 'asiq':", client?.id, client?.name, client?.subdomain);
  if (!client || client.id !== 7) {
    throw new Error(`Failed to resolve client for 'asiq' (expected id=7, got ${client?.id})`);
  }

  // 1b. Test tenantResolver middleware with alias 'asiqac'
  const mockReq = { headers: { "x-client-subdomain": "asiqac" } };
  const mockRes = { status: (code) => ({ json: (data) => { throw new Error(`Status ${code}: ${JSON.stringify(data)}`); } }) };
  await new Promise((resolve, reject) => {
    tenantResolver(mockReq, mockRes, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
  console.log("1b. Middleware resolved alias 'asiqac' -> Client ID:", mockReq.client?.id, mockReq.client?.subdomain);
  if (mockReq.client?.id !== 7) {
    throw new Error(`Failed to resolve alias 'asiqac' via tenantResolver (expected id=7, got ${mockReq.client?.id})`);
  }

  // 2. Fetch telecom configuration
  const config = await telecomConfigService.getTelecomConfigByClientId(client.id);
  console.log("2. Telecom Config Provider Key:", config?.provider_key);
  console.log("   Base URL:", config?.base_url);
  console.log("   Extra Config:", config?.extra_config);

  const extraConfig = typeof config.extra_config === "string" ? JSON.parse(config.extra_config) : config.extra_config;
  if (extraConfig?.serviceId !== "13237") {
    throw new Error(`Expected serviceId '13237', got '${extraConfig?.serviceId}'`);
  }

  // 3. Instantiate provider via factory
  const provider = telecomFactory.getTelecomProvider(config);
  console.log("3. Provider instantiated successfully:", provider.constructor.name);

  // 4. Test checkSub directly via provider with test Iraqi MSISDN
  const testMsisdn = "9647712345678";
  console.log(`4. Testing checkSub for MSISDN: ${testMsisdn}...`);
  const subInfo = await provider.checkSub(testMsisdn);
  console.log("4. Provider checkSub response:", JSON.stringify(subInfo, null, 2));

  // 5. Test subscription service checkMsisdnStatus
  console.log("5. Testing subscriptionService checkMsisdnStatus...");
  const statusResult = await subscriptionService.checkMsisdnStatus(testMsisdn, client.id);
  console.log("5. Subscription Service checkMsisdnStatus result:", JSON.stringify(statusResult, null, 2));

  // 6. Test validateOtp with dummy code (verifying upstream Beecell propagation)
  console.log("6. Testing validateOtp with dummy pin...");
  const verifyRes = await provider.validateOtp(testMsisdn, "12345");
  console.log("6. Provider validateOtp response with test pin:", JSON.stringify(verifyRes, null, 2));

  console.log("\n=== ALL TESTS PASSED SUCCESSFULLY ===");
  process.exit(0);
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
