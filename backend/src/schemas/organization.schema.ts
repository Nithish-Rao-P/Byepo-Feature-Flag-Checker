import { z } from "zod";
import { paginationQuerySchema } from "./common.schema.js";

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be URL-safe")
    .optional(),
});

export const organizationListQuerySchema = paginationQuerySchema;
