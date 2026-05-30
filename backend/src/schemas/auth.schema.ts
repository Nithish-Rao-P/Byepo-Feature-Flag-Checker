import { z } from "zod";

export const superAdminLoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email(),
  password: z.string().min(8).regex(/[A-Z]/, "Must contain at least one uppercase letter").regex(/[0-9]/, "Must contain at least one number"),
  role: z.enum(["org_admin", "end_user"]),
  organizationId: z.uuid(),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});
