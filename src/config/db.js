import mongoose from "mongoose";
import config from "./index.js";

/**
 * Establishes a connection to MongoDB with pooling for high concurrency.
 */
async function connectDB() {
  mongoose.set("strictQuery", true);

  mongoose.connection.on("connected", () => {
    console.log("[db] MongoDB connected");
  });

  mongoose.connection.on("error", (err) => {
    console.error("[db] MongoDB connection error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[db] MongoDB disconnected");
  });

  try {
    await mongoose.connect(config.db.uri, {
      autoIndex: config.isDev,
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: config.db.maxPoolSize,
      minPoolSize: config.db.minPoolSize,
      socketTimeoutMS: 45000,
    });
    console.log(`[db] Pool size ${config.db.minPoolSize}-${config.db.maxPoolSize}`);
  } catch (err) {
    console.error("[db] Initial connection failed:", err.message);
    if (config.isProd) process.exit(1);
    setTimeout(connectDB, 3000);
  }
}

async function disconnectDB() {
  await mongoose.disconnect();
  console.log("[db] MongoDB disconnected");
}

export { connectDB, disconnectDB };
