const http = require("http");
const app = require("./app");
const usersRepository = require("./modules/users/users.repository");
const axios = require("axios");

async function runTests() {
  console.log("Starting Dialog Callback Flow Test Suite...\n");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/subscription/dialog/callback`;

  const testU = `TEST_DIALOG_${Date.now()}`;
  let createdUserId = null;
  let passedCount = 0;
  let failedCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passedCount++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failedCount++;
    }
  }

  try {
    // ---------------------------------------------------------
    // TEST 1: status=PENDING, userAuthenticated=true, u exists (User Creation)
    // ---------------------------------------------------------
    console.log("---------------------------------------------------------");
    console.log("Test 1: status=PENDING, userAuthenticated=true, u exists (Creates user)");
    try {
      const res1 = await axios.get(baseUrl, {
        params: {
          u: testU,
          status: "PENDING",
          userAuthenticated: "true",
          refId: "ref1001",
        },
      });

      assert(res1.status === 200, "HTTP Status is 200 OK");
      assert(res1.data.success === true, "Response success is true");
      assert(res1.data.data.status === "PENDING", "Returned status is PENDING");
      assert(res1.data.data.authenticated === true, "authenticated is true when userAuthenticated=true");
      assert(Boolean(res1.data.data.accessToken), "accessToken is generated and returned");
      assert(Boolean(res1.data.data.refreshToken), "refreshToken is generated and returned");

      const userInDb = await usersRepository.findByMsisdn(testU);
      assert(userInDb && userInDb.id, "User created/found in Reel Backend DB");
      if (userInDb) createdUserId = userInDb.id;
    } catch (err) {
      console.error("Test 1 Error:", err.response?.data || err.message);
      failedCount++;
    }

    // ---------------------------------------------------------
    // TEST 2: status=ACTIVE, userAuthenticated=true, u exists (User Creation & Activation)
    // ---------------------------------------------------------
    console.log("\n---------------------------------------------------------");
    console.log("Test 2: status=ACTIVE, userAuthenticated=true, u exists");
    try {
      const res2 = await axios.get(baseUrl, {
        params: {
          u: testU,
          status: "ACTIVE",
          userAuthenticated: "true",
          refId: "ref1002",
        },
      });

      assert(res2.status === 200, "HTTP Status is 200 OK");
      assert(res2.data.success === true, "Response success is true");
      assert(res2.data.data.status === "ACTIVE", "Returned status is ACTIVE");
      assert(res2.data.data.authenticated === true, "authenticated is true");
      assert(Boolean(res2.data.data.accessToken), "accessToken is generated and returned");
      assert(Boolean(res2.data.data.refreshToken), "refreshToken is generated and returned");

      const userInDb = await usersRepository.findByMsisdn(testU);
      assert(userInDb && userInDb.id === createdUserId, "User is existing created user");
    } catch (err) {
      console.error("Test 2 Error:", err.response?.data || err.message);
      failedCount++;
    }

    // ---------------------------------------------------------
    // TEST 3: status=ACTIVE, userAuthenticated=false, u exists
    // ---------------------------------------------------------
    console.log("\n---------------------------------------------------------");
    console.log("Test 3: status=ACTIVE, userAuthenticated=false, u exists");
    try {
      const testU3 = `${testU}_3`;
      const res3 = await axios.get(baseUrl, {
        params: {
          u: testU3,
          status: "ACTIVE",
          userAuthenticated: "false",
          refId: "ref1003",
        },
      });

      assert(res3.status === 200, "HTTP Status is 200 OK");
      assert(res3.data.success === true, "Response success is true");
      assert(res3.data.data.status === "ACTIVE", "Returned status is ACTIVE");
      assert(res3.data.data.authenticated === false, "authenticated is false");
      assert(res3.data.data.nextStep === "AUTHENTICATION_REQUIRED", "nextStep is AUTHENTICATION_REQUIRED");
      assert(!res3.data.data.accessToken, "NO accessToken returned");
      assert(!res3.data.data.refreshToken, "NO refreshToken returned");

      const userInDb3 = await usersRepository.findByMsisdn(testU3);
      assert(userInDb3 && userInDb3.id, "User created/found in Reel Backend DB for test 3");
    } catch (err) {
      console.error("Test 3 Error:", err.response?.data || err.message);
      failedCount++;
    }

    // ---------------------------------------------------------
    // TEST 4: status=ERROR -> Must return error response, NO user created
    // ---------------------------------------------------------
    console.log("\n---------------------------------------------------------");
    console.log("Test 4: status=ERROR (Must return error and NOT create user)");
    const testUError = `TEST_DIALOG_ERR_${Date.now()}`;
    try {
      await axios.get(baseUrl, {
        params: {
          u: testUError,
          status: "ERROR",
          userAuthenticated: "true",
          refId: "ref1004",
        },
      });
      console.error("  ❌ FAIL: Expected HTTP 400 for status=ERROR");
      failedCount++;
    } catch (err) {
      assert(err.response?.status === 400, "Returns HTTP 400 for status=ERROR");
      assert(err.response?.data?.success === false, "Response success is false");
      assert(err.response?.data?.message === "Some error occurred", "Returns 'Some error occurred' message");

      const userInDbError = await usersRepository.findByMsisdn(testUError);
      assert(!userInDbError, "NO user created in database for status=ERROR");
    }

    // ---------------------------------------------------------
    // TEST 5: status=SUCCESS or unknown status -> Unsupported
    // ---------------------------------------------------------
    console.log("\n---------------------------------------------------------");
    console.log("Test 5: status=SUCCESS (Unsupported for Dialog flow)");
    try {
      await axios.get(baseUrl, {
        params: {
          u: testU,
          status: "SUCCESS",
          userAuthenticated: "true",
        },
      });
      console.error("  ❌ FAIL: Expected HTTP 400 for status=SUCCESS");
      failedCount++;
    } catch (err) {
      assert(err.response?.status === 400, "Returns HTTP 400 for status=SUCCESS");
      assert(err.response?.data?.success === false, "Response success is false");
      assert(err.response?.data?.message === "Unsupported subscription status", "Returns unsupported status message");
    }

    // ---------------------------------------------------------
    // TEST 6: Missing required u parameter
    // ---------------------------------------------------------
    console.log("\n---------------------------------------------------------");
    console.log("Test 6: Missing required u parameter");
    try {
      await axios.get(baseUrl, {
        params: {
          status: "ACTIVE",
          userAuthenticated: "true",
        },
      });
      console.error("  ❌ FAIL: Expected HTTP 400 for missing u");
      failedCount++;
    } catch (err) {
      assert(err.response?.status === 400, "Returns HTTP 400");
      assert(err.response?.data?.success === false, "Response success is false");
      assert(err.response?.data?.message === "Missing Dialog user identifier", "Correct error message returned");
    }

    // ---------------------------------------------------------
    // TEST 7: Send the same ACTIVE callback twice (Idempotency)
    // ---------------------------------------------------------
    console.log("\n---------------------------------------------------------");
    console.log("Test 7: Send the same ACTIVE callback twice (Idempotency)");
    try {
      const testU7 = `${testU}_7`;
      const res7a = await axios.get(baseUrl, {
        params: {
          u: testU7,
          status: "ACTIVE",
          userAuthenticated: "true",
          refId: "ref1007",
        },
      });

      const userFirst = await usersRepository.findByMsisdn(testU7);

      const res7b = await axios.get(baseUrl, {
        params: {
          u: testU7,
          status: "ACTIVE",
          userAuthenticated: "true",
          refId: "ref1007",
        },
      });

      const userSecond = await usersRepository.findByMsisdn(testU7);

      assert(res7a.data.data.user.id === res7b.data.data.user.id, "Both callbacks returned identical user ID");
      assert(userFirst.id === userSecond.id, "No duplicate user created in database");
      assert(Boolean(res7b.data.data.accessToken), "Tokens generated consistently for repeat callback");
    } catch (err) {
      console.error("Test 7 Error:", err.response?.data || err.message);
      failedCount++;
    }

  } finally {
    server.close();
  }

  console.log("\n=========================================================");
  console.log(`Test Results: ${passedCount} Passed, ${failedCount} Failed`);
  console.log("=========================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error("Unhandled error running tests:", err);
  process.exit(1);
});
