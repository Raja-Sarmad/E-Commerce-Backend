import mongoose from "mongoose";
import { createSlug } from "../../utils/slugify.js";
import { BLOG_STATUSES } from "../../constants/index.js";

const blogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Title is required."], trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true, index: true },
    excerpt: { type: String, default: "" },
    content: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    publicId: { type: String, default: "" },
    category: { type: String, default: "Lifestyle", index: true },
    author: { type: String, default: "NovaMart" },
    authorAvatar: { type: String, default: "" },
    authorRef: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    readTime: { type: Number, default: 3 },
    tags: [{ type: String }],
    featured: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: BLOG_STATUSES,
      default: "draft",
      index: true,
    },
    views: { type: Number, default: 0 },
    scheduledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

blogPostSchema.index({ status: 1, publishedAt: -1 });
blogPostSchema.index({ category: 1, status: 1, createdAt: -1 });
blogPostSchema.index({ tags: 1 });

blogPostSchema.virtual("publishedAt").get(function () {
  return this.scheduledAt || this.createdAt;
});

blogPostSchema.pre("save", function (next) {
  if (!this.slug || this.isModified("title")) this.slug = createSlug(this.slug || this.title);
  next();
});

blogPostSchema.set("toJSON", { virtuals: true });

const BlogPost = mongoose.model("BlogPost", blogPostSchema);

export default BlogPost;
