const axios = require("axios");

/**
 * Telecom Provider for Wellness360 Sri Lanka (Dialog SL DCB Integration)
 * Base URL: https://bilunipal.tickhighs.com/dialogsl
 */
class DialogSLProvider {
  constructor(config = {}) {
    let extra = {};
    if (typeof config.extra_config === "string") {
      try {
        extra = JSON.parse(config.extra_config);
      } catch (e) {
        extra = {};
      }
    } else if (typeof config.extra_config === "object" && config.extra_config !== null) {
      extra = config.extra_config;
    }

    this.baseUrl = config.base_url || extra.baseUrl || "https://bilunipal.tickhighs.com/dialogsl";
    this.serviceId = extra.serviceId || 153;
    this.appId = extra.appId || 3876;
    this.packId = extra.packId || 136416;

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 8000,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });
  }

  /**
   * 1. Check Active Status via Encrypted MSISDN
   * Target: POST /api/v1/subscriptions/encrypt-msisdn
   * Request Body: { "encryptedMsisdn": "..." }
   * Response: { "success": true, "message": "Encrypted MSISDN updated successfully" }
   */
  async checkSub(encryptedMsisdn) {
    try {
      if (!encryptedMsisdn) {
        return {
          success: false,
          status: "INACTIVE",
          message: "Encrypted MSISDN is required",
        };
      }

      const response = await this.client.post("/api/v1/subscriptions/encrypt-msisdn", {
        encryptedMsisdn: encryptedMsisdn,
      });

      const data = response.data || {};
      const isSuccess = data.success === true || data.status === "ACTIVE";

      return {
        success: isSuccess,
        status: isSuccess ? "ACTIVE" : "INACTIVE",
        message: data.message || "Encrypted MSISDN verified successfully",
        rawData: data,
      };
    } catch (error) {
      console.error("DialogSL checkSub Error:", error?.response?.data || error.message);
      return {
        success: false,
        status: "INACTIVE",
        message: "Failed to check subscription status with Dialog SL server",
        error: error?.response?.data || error.message,
      };
    }
  }

  /**
   * 2. Initiate Subscription (Get Operator Gateway Redirect URL)
   * Target: POST /api/v1/integration/subscribe
   */
  async initiateSubscribe(source = "WEB", medium = "WEB", campaign = "WELLNESS360") {
    try {
      const response = await this.client.post("/api/v1/integration/subscribe", {
        serviceId: this.serviceId,
        appId: this.appId,
        packId: this.packId,
        source,
        medium,
        campaign,
      });

      const data = response.data || {};
      return {
        success: Boolean(data.redirectUrl),
        redirectUrl: data.redirectUrl,
        rawData: data,
      };
    } catch (error) {
      console.error("DialogSL initiateSubscribe Error:", error?.response?.data || error.message);
      throw new Error(error?.response?.data?.message || "Failed to initiate Dialog SL subscription");
    }
  }

  /**
   * 3. Get Gateway Callback Result
   * Target: GET /api/v1/integration/subscription/result
   */
  async getSubscriptionResult(queryParams = {}) {
    try {
      const response = await this.client.get("/api/v1/integration/subscription/result", {
        params: queryParams,
      });

      const data = response.data || {};
      const isSuccess = data.status === "ACTIVE";

      return {
        success: isSuccess,
        id: data.id,
        status: data.status,
        message: data.message || "Subscription verified",
        rawData: data,
      };
    } catch (error) {
      console.error("DialogSL getSubscriptionResult Error:", error?.response?.data || error.message);
      throw new Error(error?.response?.data?.message || "Failed to fetch subscription result");
    }
  }

  /**
   * 4. Unsubscribe Flow
   * Target: POST /api/v1/integration/unsubscribe
   */
  async unsubscribe(encryptedMsisdn) {
    try {
      const response = await this.client.post("/api/v1/integration/unsubscribe", {
        encryptedMsisdn,
      });

      const data = response.data || {};
      const isSuccess = data.status === "SUCCESS" || data.status === "UNSUB";

      return {
        success: isSuccess,
        status: data.status,
        redirectUrl: data.redirectUrl,
        rawData: data,
      };
    } catch (error) {
      console.error("DialogSL unsubscribe Error:", error?.response?.data || error.message);
      throw new Error(error?.response?.data?.message || "Failed to unsubscribe user from Dialog SL");
    }
  }
}

module.exports = DialogSLProvider;
