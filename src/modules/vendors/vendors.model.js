import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    name: { type: String, required: [true, "Vendor name is required."], trim: true },
    logo: { type: String, default: "" },
    publicId: { type: String, default: "" },
    banner: { type: String, default: "" },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    description: { type: String, default: "" },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    verified: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: ["active", "pending", "suspended"],
      default: "pending",
      index: true,
    },
    productsCount: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    pendingPayout: { type: Number, default: 0 },
    commissionRate: { type: Number, default: 10, min: 0, max: 100 },
  },
  { timestamps: true }
);

vendorSchema.index({ status: 1, createdAt: -1 });
vendorSchema.index({ name: 1 });

const Vendor = mongoose.model("Vendor", vendorSchema);

export default Vendor;
