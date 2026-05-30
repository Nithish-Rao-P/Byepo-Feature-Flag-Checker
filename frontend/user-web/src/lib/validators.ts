import { z } from "zod";

export const loginFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  organizationId: z.string().uuid("Please select a valid organization"),
});

export const flagFormSchema = z.object({
  key: z
    .string()
    .min(3, "Key must be at least 3 characters")
    .regex(/^[A-Z0-9_]+$/, "Key must be uppercase alphanumeric with underscores (e.g. BETA_DASHBOARD)"),
  description: z.string().max(500, "Description must be under 500 characters").optional(),
  isEnabled: z.boolean(),
});
