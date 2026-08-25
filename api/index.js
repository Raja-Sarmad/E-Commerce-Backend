import mongoose from "mongoose";

let isConnected = false;

function getMongoUri() {
  const uri = process.env.MONGO_URI?.trim();
  if (!uri) {
    throw new Error(
      "MONGO_URI env var missing — add your MongoDB Atlas URI in Vercel → Settings → Environment Variables"
    );
  }
  if (/127\.0\.0\.1|localhost/i.test(uri)) {
    throw new Error(
      "MONGO_URI points to localhost — on Vercel use your MongoDB Atlas URI (mongodb+srv://...), not the local .env.example value"
    );
  }
  return uri;
}

async function connectDB() {
  if (isConnected && mongoose.connections[0]?.readyState === 1) return;
  const uri = getMongoUri();
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, {
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
