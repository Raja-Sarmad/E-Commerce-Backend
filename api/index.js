import mongoose from "mongoose";

let isConnected = false;

async function connectDB() {
  if (isConnected && mongoose.connections[0]?.readyState === 1) return;
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI env var missing — set it in Vercel dashboard");
  }
  mongoose.set("strictQuery", true);
  await mongoose.connect(process.env.MONGO_URI, {
    autoIndex: false,
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 1,
  });
  isConnected = true;
}

let app;

async function getApp() {
  if (app) return app;
  const mod = await import("../src/app.js");
  app = mod.default;
  return app;
}

export default async function handler(req, res) {
  try {
    await connectDB();
    const expressApp = await getApp();
    return expressApp(req, res);
  } catch (err) {
    console.error("[vercel] Error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Internal server error",
    });
  }
}
