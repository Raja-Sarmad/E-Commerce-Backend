import mongoose from "mongoose";
import { setTimeout as delay } from "node:timers/promises";
import config from "./index.js";

mongoose.connection.on("connected", () => {
  console.log("[db] MongoDB connected");
});

mongoose.connection.on("error", (err) => {
  console.error("[db] MongoDB connection error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("[db] MongoDB disconnected");
});

/**
 * Establish a connection before the server bootstraps data or accepts requests.
 * Reject on failure so server.js can stop startup instead of serving broken logins.
 */
async function connectDB() {
  mongoose.set("strictQuery", true);

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await mongoose.connect(config.db.uri, {
        autoIndex: config.isDev,
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: config.db.maxPoolSize,
        minPoolSize: config.db.minPoolSize,
        socketTimeoutMS: 45000,
      });
      console.log(`[db] Pool size ${config.db.minPoolSize}-${config.db.maxPoolSize}`);
      return;
    } catch (err) {
      // Local DNS can briefly fail Atlas SRV/TXT lookups. Keep startup waiting
      // during bounded retries; never start the API without a connection.
      if (["ESERVFAIL", "EAI_AGAIN", "ETIMEOUT"].includes(err.code) && attempt < 3) {
        console.warn(`[db] Temporary DNS failure; retrying (${attempt}/3)`);
        await delay(1000);
        continue;
      }
      console.error("[db] Initial connection failed:", err.message);
      throw err;
    }
  }
}

async function disconnectDB() {
  await mongoose.disconnect();
  console.log("[db] MongoDB disconnected");
}

export { connectDB, disconnectDB };
