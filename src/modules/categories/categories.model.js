import mongoose from "mongoose";
import { createSlug } from "../../utils/slugify.js";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Category name is required."], trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    publicId: { type: String, default: "" },
    icon: { type: String, default: "" },
    count: { type: Number, default: 0 },
    featured: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

categorySchema.index({ name: 1 });
categorySchema.index({ parent: 1, order: 1 });

categorySchema.pre("save", function (next) {
  if (!this.slug || this.isModified("name")) this.slug = createSlug(this.slug || this.name);
  next();
});

const Category = mongoose.model("Category", categorySchema);

export default Category;
