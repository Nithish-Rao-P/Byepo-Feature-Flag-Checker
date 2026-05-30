import { Prisma } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/app-error.js";

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(404, "NOT_FOUND", `Route ${req.method} ${req.originalUrl} not found`));
};

export const errorHandler = (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return res.status(500).json({
      success: false,
      error: {
        code: "DATABASE_ERROR",
        message: "Database operation failed",
        details: [],
      },
    });
  }

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "Unexpected server error",
      details: [],
    },
  });
};
