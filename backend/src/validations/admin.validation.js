const { z } = require("zod");
const { ADMIN_ROLES, REEL_STATUS } = require("../constants/enums");

const adminRoleValues = Object.values(ADMIN_ROLES);
const reelStatusValues = Object.values(REEL_STATUS);

const adminLoginSchema = {
  body: z.object({
    identifier: z
      .string({ required_error: "identifier is required" })
      .min(3, "identifier must be at least 3 characters"),
    password: z
      .string({ required_error: "password is required" })
      .min(6, "password must be at least 6 characters"),
  }),
};

const adminRegisterSchema = {
  body: z.object({
    username: z
      .string({ required_error: "username is required" })
      .min(3, "username must be at least 3 characters"),
    email: z
      .string({ required_error: "email is required" })
      .email("invalid email address"),
    password: z
      .string({ required_error: "password is required" })
      .min(6, "password must be at least 6 characters"),
    role: z.enum(adminRoleValues).optional().default(ADMIN_ROLES.ADMIN),
  }),
};

const updateReelStatusSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "id must be a numeric string"),
  }),
  body: z.object({
    status: z.enum(reelStatusValues, {
      errorMap: () => ({
        message: `status must be one of: ${reelStatusValues.join(", ")}`,
      }),
    }),
    rejection_reason: z.string().max(255).optional(),
  }),
};

module.exports = {
  adminLoginSchema,
  adminRegisterSchema,
  updateReelStatusSchema,
};
