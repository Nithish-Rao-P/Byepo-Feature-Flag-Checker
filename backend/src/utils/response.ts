import type { Response } from "express";

export const sendSuccess = <T>(res: Response, statusCode: number, data: T, message?: string) => {
  res.status(statusCode).json({
    success: true,
    ...(message ? { message } : {}),
    data,
  });
};

export const sendMessage = (res: Response, statusCode: number, message: string, data?: unknown) => {
  res.status(statusCode).json({
    success: true,
    message,
    ...(data === undefined ? {} : { data }),
  });
};
