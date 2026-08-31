import mongoose from "mongoose";

const phoneOtpSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, index: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    attempts: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

phoneOtpSchema.index({ phone: 1, createdAt: -1 });

const PhoneOtp = mongoose.model("PhoneOtp", phoneOtpSchema);

export default PhoneOtp;
