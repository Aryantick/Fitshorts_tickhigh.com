const { z } = require("zod");

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
    category: z.string().min(1, "category must not be empty").max(100).optional(),
    categoryId: z.union([z.number(), z.string()]).optional().nullable(),
    category_id: z.union([z.number(), z.string()]).optional().nullable(),
    musicId: z.number().or(z.string()).optional().nullable(),
  }).refine((data) => data.category || data.categoryId || data.category_id, {
    message: "Either category name/slug or categoryId is required",
    path: ["category"],
  }),
};

const updateReelMetadataSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, "id must be a numeric string"),
  }),
  body: z.object({
    title: z.string().min(2).max(150).optional(),
    description: z.string().max(500).optional(),
    category: z.string().min(1).max(100).optional(),
    categoryId: z.union([z.number(), z.string()]).optional().nullable(),
    category_id: z.union([z.number(), z.string()]).optional().nullable(),
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
