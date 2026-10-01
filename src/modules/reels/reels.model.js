import mongoose from "mongoose";

const reelSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },
    title: { type: String, required: [true, "Reel title is required."], trim: true },
    video: { type: String, required: [true, "Video URL is required."] },
    poster: { type: String, default: "" },
    publicId: { type: String, default: "" },
    link: { type: String, default: "/shop" },
    /** Display position 0–4 (left → right on homepage). */
    slot: {
      type: Number,
      required: true,
      min: 0,
      max: 4,
      index: true,
    },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

reelSchema.index({ storeId: 1, slot: 1 }, { unique: true });
reelSchema.index({ storeId: 1, active: 1 });

const Reel = mongoose.model("Reel", reelSchema);

export default Reel;
