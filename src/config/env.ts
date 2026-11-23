
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const requiredEnvVariables = [
  "DATABASE_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
] as const;

// Validate required environment variables
for (const variable of requiredEnvVariables) {
  if (!process.env[variable]) {
    throw new Error(
      `Missing required environment variable: ${variable}`,
    );
  }
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 5000),
  DATABASE_URL: process.env.DATABASE_URL!,
  CLIENT_URL: process.env.CLIENT_URL ?? "http://localhost:3000",

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
  JWT_ACCESS_EXPIRES_IN:
    process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",

  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  JWT_REFRESH_EXPIRES_IN:
    process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",

  COOKIE_SECURE: process.env.COOKIE_SECURE === "true",
  COOKIE_SAME_SITE: "strict" as const,

  JWT_ACCESS_COOKIE_MAX_AGE_MS: Number(
    process.env.JWT_ACCESS_COOKIE_MAX_AGE_MS ?? 900000,
  ),

  JWT_REFRESH_COOKIE_MAX_AGE_MS: Number(
    process.env.JWT_REFRESH_COOKIE_MAX_AGE_MS ?? 604800000,
  ),

  // Image hosting
  IMGBB_API_KEY: process.env.IMGBB_API_KEY ?? "",

  // Email
  SMTP_HOST: process.env.SMTP_HOST ?? "",
  SMTP_PORT: Number(process.env.SMTP_PORT ?? 587),
  SMTP_SECURE: process.env.SMTP_SECURE === "true",
  SMTP_USER: process.env.SMTP_USER ?? "",
  SMTP_PASSWORD: process.env.SMTP_PASSWORD ?? "",
  EMAIL_FROM: process.env.EMAIL_FROM ?? "",
};
