/**
 * Test script to verify Telecom Logger, cURL generation, and file storage
 */
const OrangeProvider = require("./integrations/telecom/providers/orange.provider");
const DialogSLProvider = require("./integrations/telecom/providers/dialogsl.provider");

async function test() {
  console.log("=== Testing Telecom Logger ===");

  // 1. Initialize Orange Provider
  const orange = new OrangeProvider({
    base_url: "https://obfpartner.telecomnetsolution.com",
    client_id: 2,
    subdomain: "obf",
    extra_config: {
      serviceId: "Health Portal Livliness",
      cpId: "100",
      channel: "wap",
      country: "BF",
      operator: "ORG",
      reqType: "1",
    },
  });

  console.log("\n1. Testing Orange checkSub (MSISDN: 22670123456)...");
  try {
    const res = await orange.checkSub("22670123456");
    console.log("Orange checkSub response:", res);
  } catch (err) {
    console.log("Orange checkSub completed with error handled:", err.message);
  }

  // 2. Initialize Dialog Provider
  const dialog = new DialogSLProvider({
    base_url: "https://bilunipal.tickhighs.com/dialogsl",
    client_id: 3,
    subdomain: "dialogsl",
    extra_config: {
      serviceId: 153,
      appId: 3876,
      packId: 136416,
    },
  });

  console.log("\n2. Testing Dialog checkSub (Encrypted MSISDN)...");
  try {
    const res = await dialog.checkSub("test_encrypted_msisdn_9999");
    console.log("Dialog checkSub response:", res);
  } catch (err) {
    console.log("Dialog checkSub completed with error handled:", err.message);
  }

  console.log("\n=== Test Finished ===");
}

test();
