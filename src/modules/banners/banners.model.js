import mongoose from "mongoose";
import { BANNER_POSITIONS } from "../../constants/index.js";

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Banner title is required."], trim: true },
    position: {
      type: String,
      enum: BANNER_POSITIONS,
      default: "homepage",
      index: true,
    },
    image: { type: String, default: "" },
    publicId: { type: String, default: "" },
    link: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    active: { type: Boolean, default: true, index: true },
    views: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
  },
  { timestamps: true }
);

bannerSchema.index({ position: 1, active: 1 });

const Banner = mongoose.model("Banner", bannerSchema);

export default Banner;
