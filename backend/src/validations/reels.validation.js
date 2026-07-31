const { z } = require("zod");
const { REEL_CATEGORIES } = require("../constants/enums");

const categoryValues = Object.values(REEL_CATEGORIES);

const uploadReelSchema = {
  body: z.object({
    title: z
      .string({ required_error: "title is required" })
      .min(2, "title must be at least 2 characters")
      .max(150, "title must not exceed 150 characters"),
    description: z
      .string()
      .max(500, "description must not exceed 500 characters")
      .optional(),
    rawS3Key: z.string({ required_error: "rawS3Key is required" }),
    category: z.enum(categoryValues, {
      errorMap: () => ({
        message: `category must be one of: ${categoryValues.join(", ")}`,
      }),
    }),
  }),
};

const updateReelMetadataSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "id must be a numeric string"),
  }),
  body: z.object({
    title: z.string().min(2).max(150).optional(),
    description: z.string().max(500).optional(),
    category: z.enum(categoryValues).optional(),
  }),
};

const reelIdParamSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "id must be a numeric reel ID"),
  }),
};

module.exports = {
  uploadReelSchema,
  updateReelMetadataSchema,
  reelIdParamSchema,
};
