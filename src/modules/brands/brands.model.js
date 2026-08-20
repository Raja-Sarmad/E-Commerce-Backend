import mongoose from "mongoose";
import { createSlug } from "../../utils/slugify.js";

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Brand name is required."], trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true, index: true },
    logo: { type: String, default: "" },
    publicId: { type: String, default: "" },
    description: { type: String, default: "" },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

brandSchema.index({ name: 1 });

brandSchema.pre("save", function (next) {
  if (!this.slug || this.isModified("name")) this.slug = createSlug(this.slug || this.name);
  next();
});

const Brand = mongoose.model("Brand", brandSchema);

export default Brand;
