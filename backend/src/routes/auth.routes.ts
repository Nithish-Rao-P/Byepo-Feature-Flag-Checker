import { Router } from "express";
import { login, loginSuperAdmin, signup } from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async-handler.js";
import { loginSchema, signupSchema, superAdminLoginSchema } from "../schemas/auth.schema.js";

export const authRouter = Router();

authRouter.post("/super-admin/login", validate("body", superAdminLoginSchema), asyncHandler(loginSuperAdmin));
authRouter.post("/signup", validate("body", signupSchema), asyncHandler(signup));
authRouter.post("/login", validate("body", loginSchema), asyncHandler(login));
