import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";

import config from "./config/index.js";
import sanitize from "./middlewares/sanitize.js";
import { apiLimiter } from "./middlewares/rateLimiter.js";
import {
  notFoundHandler,
  errorHandler,
} from "./middlewares/errorMiddleware.js";
import routes from "./routes/index.js";

const app = express();

/* ── Security headers ───────────────────────────────────────── */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  }),
);

/* ── CORS ───────────────────────────────────────────────────── */
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Refresh-Token"],
  }),
);

/* ── Request parsing ────────────────────────────────────────── */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use("/uploads", express.static(config.uploadsDir));

/* ── Compression & logging ──────────────────────────────────── */
app.use(compression());
if (config.isDev) app.use(morgan("dev"));
else app.use(morgan("combined"));

/* ── NoSQL injection protection ─────────────────────────────── */
app.use(sanitize);

/* ── Global rate limiting ───────────────────────────────────── */
app.use(config.apiPrefix, apiLimiter);

/* ── API routes ─────────────────────────────────────────────── */
app.use(config.apiPrefix, routes);

/* ── Health root ────────────────────────────────────────────── */
app.get("/", (_req, res) =>
  res.json({
    success: true,
    message: "NovaMart API — see /api/v1/health",
    docs: "/api/v1",
  }),
);

/* ── 404 + central error handler ────────────────────────────── */
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
