import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required."],
      uppercase: true,
      unique: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    value: { type: Number, required: true, min: 0 },
    minSpend: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: null },
    maxUses: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    usersUsed: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        count: { type: Number, default: 0 },
      },
    ],
    applicableCategories: [{ type: String }],
    applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    expiresAt: { type: Date, default: null },
    startsAt: { type: Date, default: null },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

couponSchema.index({ active: 1, expiresAt: 1 });
couponSchema.index({ type: 1, value: 1 });

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;
