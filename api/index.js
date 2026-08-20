import mongoose from "mongoose";
import app from "../src/app.js";

let isConnected = false;

async function connectDB() {
  if (isConnected && mongoose.connections[0]?.readyState === 1) return;

  mongoose.set("strictQuery", true);

  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/novamart", {
    autoIndex: false,
    serverSelectionTimeoutMS: 10000,
  });

  isConnected = true;
}

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (err) {
    console.error("[vercel] MongoDB connection failed:", err.message);
    res.status(500).json({ success: false, message: "Database connection failed" });
    return;
  }

  return app(req, res);
}
