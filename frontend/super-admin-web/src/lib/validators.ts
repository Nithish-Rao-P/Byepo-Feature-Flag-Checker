import { z } from "zod";

// Super Admin Login Form Validation Schema
export const loginFormSchema = z.object({
  email: z.string().email("Please enter a valid editorial address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Organization Creation Form Validation Schema
export const createOrgSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters").max(100),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase alphanumeric characters and dashes")
    .optional()
    .or(z.literal("")),
});
