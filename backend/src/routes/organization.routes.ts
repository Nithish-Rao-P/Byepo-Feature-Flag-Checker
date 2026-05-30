import { Router } from "express";
import {
  createOrganization,
  deleteOrganization,
  getOrganization,
  listOrganizations,
} from "../controllers/organization.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async-handler.js";
import { orgIdParamSchema } from "../schemas/common.schema.js";
import { createOrganizationSchema, organizationListQuerySchema } from "../schemas/organization.schema.js";

export const organizationRouter = Router();

// Public route to list organizations (needed for onboarding signup dropdown selection)
organizationRouter.get("/", validate("query", organizationListQuerySchema), asyncHandler(listOrganizations));

// Protected routes reserved exclusively for super_admin
organizationRouter.post("/", requireAuth, requireRole("super_admin"), validate("body", createOrganizationSchema), asyncHandler(createOrganization));
organizationRouter.get("/:orgId", requireAuth, requireRole("super_admin"), validate("params", orgIdParamSchema), asyncHandler(getOrganization));
organizationRouter.delete("/:orgId", requireAuth, requireRole("super_admin"), validate("params", orgIdParamSchema), asyncHandler(deleteOrganization));
