import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required."],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required."],
      index: true,
    },
    name: { type: String, trim: true, default: "" },
    rating: {
      type: Number,
      required: [true, "Rating is required."],
      min: [1, "Rating must be at least 1."],
      max: [5, "Rating cannot exceed 5."],
    },
    title: { type: String, trim: true, maxlength: 120, default: "" },
    body: { type: String, trim: true, required: [true, "Review body is required."], maxlength: 2000 },
    verified: { type: Boolean, default: false },
    helpful: { type: Number, default: 0 },
    helpfulBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
      index: true,
    },
  },
  { timestamps: true }
);

/* ── Indexes (query optimization) ───────────────────────────── */
reviewSchema.index({ product: 1, status: 1, createdAt: -1 });
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ user: 1, createdAt: -1 });

const Review = mongoose.model("Review", reviewSchema);

export default Review;
