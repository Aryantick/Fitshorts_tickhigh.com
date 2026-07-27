const axios = require("axios");
const teleComConf = require("../../config/telecom.config");

const client = axios.create({
  baseURL: teleComConf.baseUrl,
  timeout: 8000, // 8 sec
});

async function checksub(msisdn) {
  try {
    const response = await client.get("/sub/checksub", {
      params: {
        msisdn,
        serviceId: teleComConf.serviceId,
      },
    });
    return response.data;
  } catch (error) {
    console.error("checksub error:", error.message);
    throw new Error("Failed to call /sub/checksub");
  }
}

async function subscribeOtp(msisdn, subServiceId) {
  try {
    const response = await client.get("/otp/subscribe", {
      params: {
        msisdn,
        subServiceId,
        serviceId: teleComConf.serviceId,
        cpId: teleComConf.cpId,
        channel: teleComConf.channel,
        country: teleComConf.country,
        operator: teleComConf.operator,
        reqType: teleComConf.reqType,
        language: teleComConf.language,
      },
    });
    return response.data;
  } catch (error) {
    console.error("subscribeOtp error:", error.message);
    throw new Error("Failed to call /otp/subscribe");
  }
}

async function validateOtp(msisdn, otp) {
  try {
    const response = await client.get("/otp/validate_otp", {
      params: { msisdn, otp },
    });
    return response.data;
  } catch (error) {
    console.error("validateOtp error:", error.message);
    throw new Error("Failed to call /otp/validate_otp");
  }
}

async function authOtpGenerate(msisdn) {
  try {
    const response = await client.get("/auth/otp/generate", {
      params: {
        msisdn,
        language: teleComConf.language,
      },
    });
    return response.data;
  } catch (error) {
    console.error("authOtpGenerate error:", error.message);
    throw new Error("Failed to call /auth/otp/generate");
  }
}

async function authOtpValidate(msisdn, otp) {
  try {
    const response = await client.get("/auth/otp/validate", {
      params: { msisdn, otp },
    });

    return response.data;
  } catch (error) {
    console.error("Status:", error.response?.status);
    console.error("Data:", error.response?.data);
    console.error("URL:", error.config?.url);
    console.error("Message:", error.message);

    throw error;
  }
}

async function Unsubscription(msisdn) {
  try {
    const response = await client.get("/sub/unsub", {
      params: {
        msisdn,
        serviceId: teleComConf.serviceId,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Unsubscription error:", error.message);
    throw new Error("Failed to call /sub/unsub");
  }
}

module.exports = {
  checksub,
  subscribeOtp,
  validateOtp,
  authOtpGenerate,
  authOtpValidate,
  Unsubscription,
};
