import dotenv from "dotenv";
import { fileURLToPath, URL } from "node:url";
dotenv.config();

const isProd = process.env.NODE_ENV === "production";
const uploadsDir = fileURLToPath(new URL("../../uploads/", import.meta.url));
const numberEnv = (key, fallback) =>
  process.env[key] === undefined ? fallback : Number(process.env[key]);

const config = {
  env: process.env.NODE_ENV || "development",
  isProd,
  isDev: !isProd,
  port: Number(process.env.PORT) || 5000,
  host: process.env.HOST || "0.0.0.0",
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  serverUrl: process.env.SERVER_URL || `http://localhost:${Number(process.env.PORT) || 5000}`,
  apiPrefix: process.env.API_PREFIX || "/api/v1",
  uploadsDir,

  db: {
    uri:
      process.env.MONGO_URI ||
      "mongodb://127.0.0.1:27017/novamart",
  },

  jwt: {
    accessSecret:
      process.env.JWT_ACCESS_SECRET || "dev_access_secret_change_me",
    refreshSecret:
      process.env.JWT_REFRESH_SECRET || "dev_refresh_secret_change_me",
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },

  cookie: {
    secure: String(process.env.COOKIE_SECURE) === "true" || isProd,
    sameSite: (process.env.COOKIE_SAME_SITE || "lax"),
    accessName: process.env.COOKIE_ACCESS_NAME || "access_token",
    refreshName: process.env.COOKIE_REFRESH_NAME || "refresh_token",
    accessMaxAgeMs: 15 * 60 * 1000,
    refreshMaxAgeMs: 7 * 24 * 60 * 60 * 1000,
  },

  mail: {
    host: process.env.MAIL_HOST || "smtp.ethereal.email",
    port: Number(process.env.MAIL_PORT) || 587,
    user: process.env.MAIL_USER || "",
    pass: process.env.MAIL_PASS || "",
    secure: String(process.env.MAIL_SECURE) === "true",
    from: process.env.MAIL_FROM || "NovaMart <no-reply@novamart.com>",
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
    folder: process.env.CLOUDINARY_FOLDER || "novamart",
    uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || "",
    uploadTimeoutMs: numberEnv("CLOUDINARY_UPLOAD_TIMEOUT_MS", 120000),
    uploadRetries: numberEnv("CLOUDINARY_UPLOAD_RETRIES", 2),
    fallbackToLocal: process.env.CLOUDINARY_FALLBACK_TO_LOCAL
      ? String(process.env.CLOUDINARY_FALLBACK_TO_LOCAL) === "true"
      : false,
  },

  seed: {
    adminName: process.env.SEED_ADMIN_NAME || "Super Admin",
    adminEmail: process.env.SEED_ADMIN_EMAIL || "admin@novamart.com",
    adminPassword: process.env.SEED_ADMIN_PASSWORD || "Admin@123456",
    adminPhone: process.env.SEED_ADMIN_PHONE || "+1 555 010 0000",
  },

  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 200,
    authMax: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20,
  },

  logLevel: process.env.LOG_LEVEL || "dev",
  maxUploadMb: Number(process.env.MAX_IMAGE_UPLOAD_MB) || 5,
};

export default config;
