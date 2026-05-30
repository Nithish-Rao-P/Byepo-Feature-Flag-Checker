import { z } from "zod";

export const orgIdParamSchema = z.object({
  orgId: z.uuid(),
});

export const flagIdParamSchema = z.object({
  flagId: z.uuid(),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
});
