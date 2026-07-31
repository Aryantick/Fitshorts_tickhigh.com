const { z } = require("zod");

const sendOtpSchema = {
  body: z.object({
    msisdn: z
      .string({ required_error: "msisdn is required" })
      .min(1, "msisdn is required"),
  }),
};

const verifyOtpSchema = {
  body: z.object({
    msisdn: z
      .string({ required_error: "msisdn is required" })
      .min(1, "msisdn is required"),
    otp: z
      .string({ required_error: "otp is required" })
      .length(4, "otp must be 4 digits"),
  }),
};

module.exports = {
  sendOtpSchema,
  verifyOtpSchema,
};
