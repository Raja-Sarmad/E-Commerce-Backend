import mongoose from "mongoose";
import { createSlug } from "../../utils/slugify.js";

const pageSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Page title is required."], trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true, index: true },
    content: { type: String, default: "" },
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    published: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

pageSchema.pre("save", function (next) {
  if (!this.slug || this.isModified("title")) this.slug = createSlug(this.slug || this.title);
  next();
});

const Page = mongoose.model("Page", pageSchema);

export default Page;
