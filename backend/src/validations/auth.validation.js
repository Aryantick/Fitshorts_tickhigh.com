const { z } = require("zod");

const sendOtpSchema = {
  body: z.object({
    msisdn: z
      .string({ required_error: "msisdn is required" })
      .min(1, "msisdn is required"),
    subServiceId: z.any().optional(),
  }),
};

const verifyOtpSchema = {
  body: z.object({
    msisdn: z
      .string({ required_error: "msisdn is required" })
      .min(1, "msisdn is required"),
    otp: z
      .string({ required_error: "otp is required" })

  }),
};

module.exports = {
  sendOtpSchema,
  verifyOtpSchema,
};
