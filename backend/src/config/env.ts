import dotenv from "dotenv";

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "5000"),
  DATABASE_URL: process.env.DATABASE_URL || "",
  JWT_SECRET: process.env.JWT_SECRET || "default-secret",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "default-refresh-secret",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "15m",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
  API_VERSION: process.env.API_VERSION || "v1",
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: parseInt(process.env.SMTP_PORT || "587"),
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  FROM_EMAIL: process.env.FROM_EMAIL || "noreply@maintainiq.com",
  FROM_NAME: process.env.FROM_NAME || "MaintainIQ",
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",

  // AI Issue Triage (section 6.1 of the hackathon brief) — never expose this
  // key to the frontend, it is only ever used from this server.
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
  AI_MODEL: process.env.AI_MODEL || "claude-haiku-4-5-20251001",
  AI_TIMEOUT_MS: parseInt(process.env.AI_TIMEOUT_MS || "15000"),

  // Public asset page (QR code target), e.g. https://maintainiq.app
  PUBLIC_APP_URL: process.env.PUBLIC_APP_URL || process.env.FRONTEND_URL || "http://localhost:5173",
};
