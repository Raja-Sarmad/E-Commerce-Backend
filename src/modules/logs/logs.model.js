import mongoose from "mongoose";
import { LOG_TYPES } from "../../constants/index.js";

const logEntrySchema = new mongoose.Schema(
  {
    type: { type: String, enum: LOG_TYPES, required: true, index: true },
    user: { type: String, default: "System" },
    action: { type: String, required: true },
    details: { type: String, default: "" },
    ip: { type: String, default: "" },
    level: {
      type: String,
      enum: ["info", "warning", "error", "success"],
      default: "info",
      index: true,
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

logEntrySchema.index({ type: 1, createdAt: -1 });
logEntrySchema.index({ createdAt: -1 });
logEntrySchema.index({ level: 1, createdAt: -1 });

const LogEntry = mongoose.model("LogEntry", logEntrySchema);

export default LogEntry;
