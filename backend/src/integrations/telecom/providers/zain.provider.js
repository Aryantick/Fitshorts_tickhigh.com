const axios = require("axios");
const telecomMapper = require("../telecom.mapper");

class ZainProvider {
  constructor(config) {
    if (!config || !config.base_url) {
      throw new Error("ZainProvider requires base_url in telecom config");
    }

    const extra = config.extra_config || {};
    this.baseUrl = config.base_url;
    this.serviceId = extra.serviceId || "WELLNESS";
    this.cpId = extra.cpId || "100";
    this.channel = extra.channel || "wap";
    this.country = extra.country || "SS";
    this.operator = extra.operator || "ZAIN";
    this.reqType = extra.reqType || "1";
    this.language = extra.language || "_E";

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 8000,
    });
  }

  async checkSub(msisdn) {
    try {
      const response = await this.client.get("/sub/checksub", {
        params: {
          msisdn,
          serviceId: this.serviceId,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Zain checkSub error:", error.message);
      throw new Error("Failed to call /sub/checksub");
    }
  }

  async subscribeOtp(msisdn, subServiceId) {
    try {
      const response = await this.client.get("/otp/subscribe", {
        params: {
          msisdn,
          subServiceId,
          serviceId: this.serviceId,
          cpId: this.cpId,
          channel: this.channel,
          country: this.country,
          operator: this.operator,
          reqType: this.reqType,
          language: this.language,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Zain subscribeOtp error:", error.message);
      throw new Error("Failed to call /otp/subscribe");
    }
  }

  async validateOtp(msisdn, otp) {
    try {
      const response = await this.client.get("/otp/validate_otp", {
        params: { msisdn, otp },
      });
      return response.data;
    } catch (error) {
      console.error("Zain validateOtp error:", error.message);
      throw new Error("Failed to call /otp/validate_otp");
    }
  }

  async authOtpGenerate(msisdn) {
    try {
      const response = await this.client.get("/auth/otp/generate", {
        params: {
          msisdn,
          language: this.language,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Zain authOtpGenerate error:", error.message);
      throw new Error("Failed to call /auth/otp/generate");
    }
  }

  async authOtpValidate(msisdn, otp) {
    try {
      const response = await this.client.get("/auth/otp/validate", {
        params: { msisdn, otp },
      });
      return response.data;
    } catch (error) {
      console.error("Zain authOtpValidate error:", error.message);
      throw error;
    }
  }

  async unsubscription(msisdn) {
    try {
      const response = await this.client.get("/sub/unsub", {
        params: {
          msisdn,
          serviceId: this.serviceId,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Zain unsubscription error:", error.message);
      throw new Error("Failed to call /sub/unsub");
    }
  }
}

module.exports = ZainProvider;
