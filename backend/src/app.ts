import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { authRouter } from "./routes/auth.routes.js";
import { flagRouter } from "./routes/flag.routes.js";
import { organizationRouter } from "./routes/organization.routes.js";

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    }),
  );
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.status(200).json({ success: true, data: { status: "ok" } });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/organizations", organizationRouter);
  app.use("/api/flags", flagRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
