import mongoose from "mongoose";

const subscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name: { type: String, default: "" },
    source: { type: String, default: "Footer form" },
    status: {
      type: String,
      enum: ["active", "unsubscribed"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

subscriberSchema.index({ status: 1, createdAt: -1 });

const Subscriber = mongoose.model("Subscriber", subscriberSchema);

export default Subscriber;
