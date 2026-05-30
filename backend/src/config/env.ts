import dotenv from "dotenv";

dotenv.config();

const required = (key: string, fallback?: string) => {
  const value = process.env[key] ?? fallback;

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

export const env = {
  port: Number(process.env.PORT ?? 3000),
  jwtSecret: required("JWT_SECRET", "development-only-secret-change-me"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "24h",
  superAdminEmail: required("SUPER_ADMIN_EMAIL", "superadmin@flagcheck.com"),
  superAdminPassword: required("SUPER_ADMIN_PASSWORD", "SuperSecure@2026"),
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:3001,http://localhost:3002,http://localhost:3003")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};
