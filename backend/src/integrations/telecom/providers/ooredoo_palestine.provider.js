const axios = require("axios");
const { attachTelecomLogger } = require("../../../utils/telecomLogger");

class OOREDOO_PALESTINE {
    constructor(config) {
        if (!config || !config.base_url) {
            throw new Error("OOREDOO_PALESTINE provider requires base_url in telecom config")
        }

        const extra = config.extra_config || {};
        this.baseUrl = config.base_url;
        this.serviceId = extra.serviceId || "581";
        this.merchantId = extra.merchantId || "169";
        this.current = extra.current || "true";
        this.transactionChannel = extra.transactionChannel || "Wifi";
        this.operator = extra.operator || "WM"
        this.subdomain = config.subdomain || "opal";
        this.clientId = config.client_id || 4;
        this.purchaseTypeId = config.purchaseTypeId || 2;

        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: 8000,
        })
        attachTelecomLogger(this.client, {
            provider: "OOREDOO_PALESTINE",
            clientSubdomain: this.subdomain,
            clientId: this.clientId,
        });
    }

    async checkSub(msisdn) {
        try {
            const response = await this.client.get("/api/dcb/subscriptions", {
                metadata: { action: "checkSub", msisdn },
                params: {
                    msisdn,
                    serviceId: this.serviceId,
                    current: this.current,
                    page: 0,
                    size: 20,
                },
            });

            const resData = response.data;
            let items = [];
            if (Array.isArray(resData)) {
                items = resData;
            } else if (Array.isArray(resData?.data?.items)) {
                items = resData.data.items;
            } else if (Array.isArray(resData?.items)) {
                items = resData.items;
            } else if (resData?.data && typeof resData.data === "object") {
                items = [resData.data];
            }

            const firstItem = items[0] || {};
            const itemStatus = String(firstItem.status || "").toUpperCase();
            const entitlementActive = Boolean(firstItem.entitlementActive);

            let currentStatus = "unsub";
            let subscriptionStatus = "INACTIVE";

            if (itemStatus === "ACTIVE" || entitlementActive || itemStatus === "TRIAL_ACTIVE") {
                currentStatus = "active";
                subscriptionStatus = "ACTIVE";
            } else if (itemStatus === "PARKED_NO_BALANCE") {
                currentStatus = "parking";
                subscriptionStatus = "PARKED_NO_BALANCE";
            } else {
                currentStatus = "unsub";
                subscriptionStatus = itemStatus || "INACTIVE";
            }

            return {
                responseCode: "0",
                data: {
                    currentStatus,
                    subscriptionStatus,
                    items,
                    ...resData,
                },
            };
        } catch (error) {
            console.error("Ooredoo Palestine checkSub error:", error.message);
            return {
                responseCode: "0",
                data: {
                    currentStatus: "unsub",
                    subscriptionStatus: "INACTIVE",
                },
            };
        }
    }

    /**
     * 2. Send Subscription OTP / Request PIN
     * Target: POST /api/dcb/pincode NEW USER
     */
    async subscribeOtp(msisdn, subServiceId) {
        try {
            const purchaseTypeId = (typeof subServiceId === "number" || /^\d+$/.test(subServiceId))
                ? Number(subServiceId)
                : Number(this.purchaseTypeId || 2);

            const payload = {
                merchantId: Number(this.merchantId),
                serviceId: Number(this.serviceId),
                purchaseTypeId: purchaseTypeId,
                msisdn: String(msisdn),
                transactionChannel: this.transactionChannel || "Wifi",
                operator: this.operator || "WM",
                subscription: "",
            };

            const response = await this.client.post("/api/dcb/pincode", payload, {
                metadata: { action: "subscribeOtp", msisdn },
                headers: { "Content-Type": "application/json" },
            });

            const resData = response.data || {};
            const isSuccess = resData.status === "SUCCESS" || resData.code === 200 || response.status === 200;
            const txnId = resData.providerRequestId || resData.providerResponse?.PinInfo?.ID || `TXN_${Date.now()}`;

            return {
                responseCode: isSuccess ? "0" : String(resData.code || resData.responseCode || "1"),
                transactionId: String(txnId),
                ...resData,
            };
        } catch (error) {
            console.error("Ooredoo Palestine subscribeOtp error:", error.message);
            return {
                responseCode: "1",
                message: error.response?.data?.message || error.message || "Failed to send PIN",
            };
        }
    }

    // Alias for NewUserOtpSend
    async NewUserOtpSend(msisdn, subServiceId) {
        return this.subscribeOtp(msisdn, subServiceId);
    }

    /**
     * Helper to fetch latest requestId for this msisdn from database if not passed
     */
    async getLatestTransactionId(msisdn) {
        try {
            const pool = require("../../../config/db.config");
            const [rows] = await pool.query(
                "SELECT transaction_id FROM otp_requests WHERE msisdn = ? ORDER BY id DESC LIMIT 1",
                [msisdn]
            );
            return rows && rows.length > 0 ? rows[0].transaction_id : null;
        } catch (err) {
            console.error("Error fetching transaction_id:", err.message);
            return null;
        }
    }

    /**
     * 3. Validate Subscription OTP / Confirm PIN
     * Target: PUT /api/dcb/confirmation NEW USER VERIFY
     */
    async validateOtp(msisdn, otp, requestId = null) {
        try {
            const txnId = requestId || (await this.getLatestTransactionId(msisdn));

            const payload = {
                id: Number(txnId),
                pinCode: Number(otp),
            };

            const response = await this.client.put("/api/dcb/confirmation", payload, {
                metadata: { action: "validateOtp", msisdn },
                headers: { "Content-Type": "application/json" },
            });

            const resData = response.data || {};
            const isSuccess = resData.status === "SUCCESS" || resData.code === 200 || response.status === 200;

            return {
                responseCode: isSuccess ? "0" : String(resData.code || "1"),
                status: isSuccess ? "successful" : "failed",
                ...resData,
            };
        } catch (error) {
            console.error("Ooredoo Palestine validateOtp error:", error.message);
            return {
                responseCode: "1",
                message: error.response?.data?.message || error.message || "Invalid or expired PIN code",
            };
        }
    }

    /**
     * 4. Send Auth OTP (Login Flow for existing users)
     */
    async authOtpGenerate(msisdn) {
        return this.subscribeOtp(msisdn);
    }

    /**
     * 5. Validate Auth OTP (Login Flow for existing users)
     */
    async authOtpValidate(msisdn, otp, requestId = null) {
        return this.validateOtp(msisdn, otp, requestId);
    }

    /**
     * 6. Unsubscribe User
     * Target: POST /api/dcb/unsub
     */
    async unsubscription(msisdn) {
        try {
            const payload = {
                merchantId: Number(this.merchantId),
                ServiceID: Number(this.serviceId),
                MSISDN: String(msisdn),
                OperatorID: this.operator || "WM",
            };

            const response = await this.client.post("/api/dcb/unsub", payload, {
                metadata: { action: "unsubscription", msisdn },
                headers: { "Content-Type": "application/json" },
            });

            const resData = response.data || {};
            const isSuccess = resData.status === "SUCCESS" || resData.code === 200 || response.status === 200;

            return {
                responseCode: isSuccess ? "0" : "1",
                status: "unSubscribed",
                ...resData,
            };
        } catch (error) {
            console.error("Ooredoo Palestine unsubscription error:", error.message);
            return {
                responseCode: "0",
                status: "unSubscribed",
            };
        }
    }
}

module.exports = OOREDOO_PALESTINE;