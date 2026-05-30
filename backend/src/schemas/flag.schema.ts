import { z } from "zod";
import { paginationQuerySchema } from "./common.schema.js";

const flagKeySchema = z.string().trim().min(3).max(100).regex(/^[A-Za-z0-9_]+$/, "Use only letters, numbers, and underscores");

export const createFlagSchema = z.object({
  key: flagKeySchema,
  description: z.string().trim().max(500).optional(),
  isEnabled: z.boolean().optional(),
});

export const updateFlagSchema = z
  .object({
    key: flagKeySchema.optional(),
    description: z.string().trim().max(500).nullable().optional(),
    isEnabled: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "At least one field is required");

export const flagListQuerySchema = paginationQuerySchema.extend({
  isEnabled: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

export const checkFlagSchema = z.object({
  featureKey: flagKeySchema,
});
