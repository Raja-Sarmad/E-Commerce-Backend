import mongoose from "mongoose";
import { createSlug } from "../../utils/slugify.js";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required."],
      trim: true,
      maxlength: [200, "Product name must be under 200 characters."],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    brand: { type: String, trim: true, index: true },
    brandRef: { type: mongoose.Schema.Types.ObjectId, ref: "Brand", default: null },
    category: { type: String, trim: true, index: true },
    categoryRef: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    categorySlug: { type: String, trim: true },

    description: { type: String, default: "" },
    features: [{ type: String }],
    specifications: { type: Map, of: String, default: {} },
    materials: { type: String, default: "" },
    sizeGuide: { type: String, default: "" },
    shippingInfo: { type: String, default: "" },

    price: {
      type: Number,
      required: [true, "Price is required."],
      min: [0, "Price cannot be negative."],
      index: true,
    },
    compareAtPrice: { type: Number, default: null },

    images: [{ type: String }],
    publicIds: [{ type: String }],

    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewsCount: { type: Number, default: 0 },
    totalSold: { type: Number, default: 0, min: 0, index: true },

    stock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 10 },
    sku: { type: String, trim: true, unique: true, sparse: true },

    tags: [{ type: String }],

    isFeatured: { type: Boolean, default: false, index: true },
    isBestSeller: { type: Boolean, default: false, index: true },
    isNew: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    onSale: { type: Boolean, default: false, index: true },

    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    colors: [{ type: String }],
    sizes: [{ type: String }],
    variants: [
      {
        size: { type: String, required: true },
        stock: { type: Number, default: 0, min: 0 },
      },
    ],

    position: { type: Number, default: 0, index: true },

    isActive: { type: Boolean, default: true, index: true },

    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

/* ── Indexes (query optimization) ───────────────────────────── */
productSchema.index({ name: 1 });
productSchema.index({ category: 1, price: 1, createdAt: -1 });
productSchema.index({ brand: 1, price: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ onSale: 1, isActive: 1 });
productSchema.index({ price: 1, isActive: 1 });
productSchema.index({ stock: 1 });
productSchema.index(
  { name: "text", description: "text", brand: "text", tags: "text", category: "text" },
  { weights: { name: 10, brand: 5, tags: 3, category: 2, description: 1 } }
);

/* ── Pre-save hooks ─────────────────────────────────────────── */
productSchema.pre("save", function (next) {
  if (this.isModified("name") && !this.slug) {
    this.slug = createSlug(this.name);
  }
  if (this.compareAtPrice && this.price < this.compareAtPrice) {
    this.onSale = true;
    this.discountPercent = Math.round(
      ((this.compareAtPrice - this.price) / this.compareAtPrice) * 100
    );
  } else {
    this.onSale = false;
    this.discountPercent = 0;
  }
  // Auto-sync total stock from variants when variants exist
  if (this.isModified("variants") && this.variants && this.variants.length > 0) {
    this.stock = this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  }
  next();
});

productSchema.virtual("isLowStock").get(function () {
  return this.stock <= this.lowStockThreshold;
});

productSchema.virtual("totalVariantStock").get(function () {
  if (!this.variants || this.variants.length === 0) return this.stock;
  return this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
});

productSchema.methods.getVariantStock = function (size) {
  if (!size || !this.variants || this.variants.length === 0) return this.stock;
  const variant = this.variants.find((v) => v.size === size);
  return variant ? variant.stock : 0;
};

productSchema.set("toJSON", { virtuals: true });

const Product = mongoose.model("Product", productSchema);

export default Product;
