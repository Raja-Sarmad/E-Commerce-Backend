import mongoose from "mongoose";
import { MEDIA_TYPES } from "../../constants/index.js";

const mediaFileSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true },
    publicId: { type: String, default: "" },
    type: { type: String, enum: MEDIA_TYPES, default: "image", index: true },
    size: { type: Number, default: 0 },
    folder: { type: String, default: "Other", index: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

mediaFileSchema.index({ folder: 1, createdAt: -1 });
mediaFileSchema.index({ type: 1, createdAt: -1 });

const MediaFile = mongoose.model("MediaFile", mediaFileSchema);

export default MediaFile;
