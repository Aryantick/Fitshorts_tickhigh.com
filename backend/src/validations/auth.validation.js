const { z } = require("zod");

const sendOtpSchema = {
  body: z.object({
    msisdn: z
      .string({ required_error: "msisdn is required" })
      .min(1, "msisdn is required"),
    subServiceId: z.any().optional(),
    purchaseTypeId: z.any().optional(),
  }).passthrough(),
};

const verifyOtpSchema = {
  body: z.object({
    msisdn: z
      .coerce
      .string({ required_error: "msisdn is required" })
      .min(1, "msisdn is required"),
    otp: z
      .coerce
      .string({ required_error: "otp is required" })
      .min(1, "otp is required"),
  }).passthrough(),
};

module.exports = {
  sendOtpSchema,
  verifyOtpSchema,
};
