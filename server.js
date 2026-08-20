import app from "./src/app.js";
import config from "./src/config/index.js";
import { connectDB, disconnectDB } from "./src/config/db.js";
import { ensureDefaultPaymentMethods } from "./src/seed/bootstrap.js";

let server;

async function start() {
  await connectDB();
  await ensureDefaultPaymentMethods();

  server = app.listen(config.port, config.host, () => {
    console.log(`[server] NovaMart API running at http://${config.host}:${config.port}`);
    console.log(`[server] Environment: ${config.env}`);
    console.log(`[server] API prefix: ${config.apiPrefix}`);
  });
}

start().catch((err) => {
  console.error("[server] Failed to start:", err);
  process.exit(1);
});

/* ── Graceful shutdown ──────────────────────────────────────── */
const shutdown = async (signal) => {
  console.log(`[server] ${signal} received. Shutting down gracefully...`);
  if (server) server.close();
  await disconnectDB();
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (reason) => {
  console.error("[server] Unhandled rejection:", reason);
  shutdown("unhandledRejection");
});
process.on("uncaughtException", (err) => {
  console.error("[server] Uncaught exception:", err);
  shutdown("uncaughtException");
});
