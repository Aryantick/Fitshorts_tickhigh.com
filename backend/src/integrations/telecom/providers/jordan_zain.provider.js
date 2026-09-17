const axios = require("axios");
const { attachTelecomLogger } = require("../../../utils/telecomLogger");

/**
 * Jordan Zain (Beecell Gateway) Provider Implementation
 * Multi-tenant fitness reels platform adapter for Jordan (subdomain: 'zajo')
 * 
 * Supports:
 * 1. GET  /beecell/api/users/info (checksub) with serviceId=13082
 * 2. POST /beecell/api/otp/send   (new user otp send)
 * 3. POST /beecell/api/otp/verify (new user otp verify)
 * 
 * Active users bypass Auth OTP via directAccess: true in telecom_configs.
 * Unsubscription completes locally as gateway provides no unsub endpoint.
 */
class JordanZainProvider {
  constructor(config) {
    if (!config || !config.base_url) {
      throw new Error("JordanZainProvider requires base_url in telecom config");
    }

    const extra = config.extra_config || {};
    this.baseUrl = config.base_url;
    this.serviceId = extra.serviceId || "13082";
    this.subdomain = config.subdomain || "zajo";
    this.clientId = config.client_id || 6;

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 8000,
    });

    attachTelecomLogger(this.client, {
      provider: "JORDAN_ZAIN",
      clientSubdomain: this.subdomain,
      clientId: this.clientId,
    });
  }

  /**
   * 1. Check Subscription Status
   * Target: GET /beecell/api/users/info?msisdn={msisdn}&serviceId={serviceId}
   * 
   * Gateway Responses:
   * - {"status":"active_subscriber", "activationDate":"...", "renewalDate":"..."}
   * - {"status":"inactive_subscriber", "activationDate":"...", "renewalDate":"..."}
   * - {"status":"unsubscriber"}
   * - {"status":"notFound"}
   */
  async checkSub(msisdn) {
    try {
      const response = await this.client.get("/beecell/api/users/info", {
        metadata: { action: "checkSub", msisdn },
        params: {
          msisdn: String(msisdn),
          serviceId: this.serviceId,
        },
      });

      const data = response.data || {};
      const rawStatus = String(data.status || "").toLowerCase();

      let currentStatus = "unsub";
      let subscriptionStatus = "INACTIVE";

      if (rawStatus === "active_subscriber" || rawStatus === "active") {
        currentStatus = "active";
        subscriptionStatus = "ACTIVE";
      } else if (rawStatus === "inactive_subscriber") {
        currentStatus = "unsub";
        subscriptionStatus = "INACTIVE";
      } else if (rawStatus === "unsubscriber") {
        currentStatus = "unsub";
        subscriptionStatus = "UNSUBSCRIBER";
      } else if (rawStatus === "notfound" || rawStatus === "not_found") {
        currentStatus = "unsub";
        subscriptionStatus = "NOT_FOUND";
      } else {
        currentStatus = "unsub";
        subscriptionStatus = data.status || "UNKNOWN";
      }

      return {
        responseCode: "0",
        data: {
          currentStatus,
          subscriptionStatus,
          activationDate: data.activationDate || data.activation_date || null,
          renewalDate: data.renewalDate || data.renewal_date || null,
          ...data,
        },
      };
    } catch (error) {
      console.error("Jordan Zain checkSub error:", error.message);
      return {
        responseCode: "0",
        data: {
          currentStatus: "unsub",
          subscriptionStatus: "UNKNOWN",
        },
      };
    }
  }

  /**
   * 2. Send Subscription OTP (New User)
   * Target: POST /beecell/api/otp/send
   * Payload: { "msisdn": "962791234567" }
   */
  async subscribeOtp(msisdn, subServiceId = null) {
    try {
      const payload = {
        msisdn: String(msisdn),
      };

      const response = await this.client.post("/beecell/api/otp/send", payload, {
        metadata: { action: "subscribeOtp", msisdn },
        headers: { "Content-Type": "application/json" },
      });

      const data = response.data || {};
      const isSuccess =
        data.success !== false &&
        (response.status === 200 || data.responseType === 200 || data.success === true);

      const txnId = data.transactionId || data.transId || `TXN_${Date.now()}`;

      return {
        responseCode: isSuccess ? "0" : String(data.responseType || "1"),
        transactionId: String(txnId),
        message: data.message || (isSuccess ? "OTP sent successfully" : "Failed to send OTP"),
        ...data,
      };
    } catch (error) {
      console.error("Jordan Zain subscribeOtp error:", error.message);
      const resData = error.response?.data || {};
      return {
        responseCode: String(resData.responseType || "1"),
        message: resData.message || error.message || "Failed to send OTP",
      };
    }
  }

  /**
   * 3. Validate Subscription OTP (New User)
   * Target: POST /beecell/api/otp/verify
   * Payload: { "msisdn": "962791234567", "code": "12345" }
   */
  async validateOtp(msisdn, otp) {
    try {
      const payload = {
        msisdn: String(msisdn),
        code: String(otp),
      };

      const response = await this.client.post("/beecell/api/otp/verify", payload, {
        metadata: { action: "validateOtp", msisdn },
        headers: { "Content-Type": "application/json" },
      });

      const data = response.data || {};
      const isSuccess = Boolean(
        data.success === true ||
        data.responseType === 200 ||
        (response.status === 200 && data.success !== false)
      );

      return {
        responseCode: isSuccess ? "0" : String(data.responseType || "1"),
        status: isSuccess ? "successful" : "failed",
        message: data.message || (isSuccess ? "OTP verified successfully" : "OTP verification failed"),
        ...data,
      };
    } catch (error) {
      console.error("Jordan Zain validateOtp error:", error.message);
      const resData = error.response?.data || {};
      return {
        responseCode: String(resData.responseType || "1"),
        status: "failed",
        message: resData.message || error.message || "OTP verification failed",
      };
    }
  }

  /**
   * 4. Send Auth OTP (Login Flow)
   * Fallback for existing users if directAccess is bypassed
   */
  async authOtpGenerate(msisdn) {
    return this.subscribeOtp(msisdn);
  }

  /**
   * 5. Validate Auth OTP (Login Flow)
   */
  async authOtpValidate(msisdn, otp) {
    return this.validateOtp(msisdn, otp);
  }

  /**
   * 6. Unsubscribe User
   * Gateway does not provide unsub endpoint; completes gracefully locally
   */
  async unsubscription(msisdn) {
    return {
      responseCode: "0",
      status: "unSubscribed",
      message: "Unsubscribed successfully locally",
    };
  }

  /**
   * Subscription Plan Sync
   */
  async syncSubscription(msisdn, subServiceId) {
    return {
      responseCode: "0",
      status: "successful",
    };
  }
}

module.exports = JordanZainProvider;
