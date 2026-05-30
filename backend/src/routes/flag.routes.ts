import { Router } from "express";
import {
  checkFlag,
  createFlag,
  deleteFlag,
  getFlag,
  listFlags,
  toggleFlag,
  updateFlag,
} from "../controllers/flag.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async-handler.js";
import { flagIdParamSchema } from "../schemas/common.schema.js";
import { checkFlagSchema, createFlagSchema, flagListQuerySchema, updateFlagSchema } from "../schemas/flag.schema.js";

export const flagRouter = Router();

flagRouter.post("/check", requireAuth, requireRole("end_user"), validate("body", checkFlagSchema), asyncHandler(checkFlag));

flagRouter.use(requireAuth, requireRole("org_admin"));
flagRouter.post("/", validate("body", createFlagSchema), asyncHandler(createFlag));
flagRouter.get("/", validate("query", flagListQuerySchema), asyncHandler(listFlags));
flagRouter.get("/:flagId", validate("params", flagIdParamSchema), asyncHandler(getFlag));
flagRouter.patch("/:flagId", validate("params", flagIdParamSchema), validate("body", updateFlagSchema), asyncHandler(updateFlag));
flagRouter.patch("/:flagId/toggle", validate("params", flagIdParamSchema), asyncHandler(toggleFlag));
flagRouter.delete("/:flagId", validate("params", flagIdParamSchema), asyncHandler(deleteFlag));
