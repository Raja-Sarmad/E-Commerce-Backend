import mongoose from "mongoose";
import { NOTIFICATION_TYPES } from "../../constants/index.js";

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, default: "" },
    link: { type: String, default: "" },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
    audience: {
      type: String,
      enum: ["admin", "user", "all"],
      default: "admin",
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ audience: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
