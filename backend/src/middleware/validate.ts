import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { ZodError } from "zod";
import { AppError } from "../utils/app-error.js";

type RequestPart = "body" | "params" | "query";

export const validate =
  (part: RequestPart, schema: ZodType) =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[part]);

      if (part === "query") {
        Object.defineProperty(req, "query", {
          value: parsed,
          configurable: true,
        });
      } else {
        req[part] = parsed;
      }

      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        return next(new AppError(400, "VALIDATION_ERROR", "Request validation failed", details));
      }

      return next(error);
    }
  };
