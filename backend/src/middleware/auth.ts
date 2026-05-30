import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { AuthRole, AuthUser } from "../types/express.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";

interface TokenPayload {
  id: string;
  email: string;
  role: AuthRole;
  organizationId?: string | null;
}

export const signToken = (user: AuthUser) =>
  jwt.sign(user, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  });

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return next(new AppError(401, "UNAUTHORIZED", "Missing Bearer token"));
  }

  try {
    const payload = jwt.verify(header.slice(7), env.jwtSecret) as TokenPayload;
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      organizationId: payload.organizationId ?? null,
    };
    return next();
  } catch {
    return next(new AppError(401, "UNAUTHORIZED", "Invalid or expired token"));
  }
};

export const requireRole =
  (...roles: AuthRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, "UNAUTHORIZED", "Authentication required"));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, "FORBIDDEN", "Insufficient permissions"));
    }

    return next();
  };
