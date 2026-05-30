import { describe, expect, it } from "vitest";
import { signupSchema } from "../src/schemas/auth.schema.js";
import { createFlagSchema } from "../src/schemas/flag.schema.js";
import { createOrganizationSchema } from "../src/schemas/organization.schema.js";
import { toSlug } from "../src/utils/slug.js";

describe("schema and utility behavior", () => {
  it("creates URL-safe organization slugs", () => {
    expect(toSlug("Acme Corporation")).toBe("acme-corporation");
    expect(toSlug("  Stark & Sons  ")).toBe("stark-sons");
  });

  it("validates org admin and end user signup payloads", () => {
    const result = signupSchema.safeParse({
      name: "Jane Doe",
      email: "jane@example.com",
      password: "Secure123",
      role: "org_admin",
      organizationId: "550e8400-e29b-41d4-a716-446655440001",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid feature flag keys", () => {
    const result = createFlagSchema.safeParse({
      key: "bad-key",
      isEnabled: true,
    });

    expect(result.success).toBe(false);
  });

  it("accepts organization creation with an optional slug", () => {
    const result = createOrganizationSchema.safeParse({
      name: "Acme Corporation",
      slug: "acme-corp",
    });

    expect(result.success).toBe(true);
  });
});
