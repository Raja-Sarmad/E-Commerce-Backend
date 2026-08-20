import mongoose from "mongoose";
import config from "../config/index.js";
import Category from "../modules/categories/categories.model.js";
import Product from "../modules/products/products.model.js";
import { createSlug } from "../utils/slugify.js";

const categories = [
  { name: "Electronics", description: "Audio, wearables & smart devices", icon: "FiMonitor", featured: true },
  { name: "Fashion", description: "Apparel, footwear & accessories", icon: "FiShoppingBag", featured: true },
  { name: "Home & Living", description: "Furniture, decor & essentials", icon: "FiHome", featured: true },
  { name: "Beauty & Care", description: "Skincare, cosmetics & wellness", icon: "FiHeart", featured: false },
  { name: "Sports & Outdoors", description: "Fitness gear & outdoor equipment", icon: "FiActivity", featured: false },
  { name: "Toys & Kids", description: "Toys, games & children's items", icon: "FiSmile", featured: false },
];

const testProducts = [
  {
    name: "Aurora Wireless Headphones Pro",
    brand: "Sonix",
    category: "Electronics",
    categorySlug: "electronics",
    description: "Studio-quality sound with active noise cancellation, adaptive EQ and a 40-hour battery life.",
    features: ["Active Noise Cancellation", "40-hour battery life", "Bluetooth 5.4", "Spatial audio"],
    price: 199,
    compareAtPrice: 249,
    stock: 46,
    sku: "SNX-HDP-001",
    tags: ["wireless", "audio", "noise-cancelling"],
    isFeatured: true,
    isBestSeller: true,
    isTrending: true,
    onSale: true,
    colors: ["#1e293b", "#f8fafc"],
    rating: 4.8,
    reviewsCount: 1284,
    images: ["https://picsum.photos/seed/aurora/700/700"],
    isActive: true,
  },
  {
    name: "Pulse Fit Smartwatch",
    brand: "TechOne",
    category: "Electronics",
    categorySlug: "electronics",
    description: "Track every heartbeat, step and sleep cycle with a vivid AMOLED display and 7-day battery.",
    features: ["1.4-inch AMOLED display", "Built-in GPS", "100+ workout modes", "5ATM water resistance"],
    price: 149,
    compareAtPrice: 199,
    stock: 38,
    sku: "TCH-SMR-002",
    tags: ["smartwatch", "fitness", "wearable"],
    isFeatured: true,
    isBestSeller: true,
    isTrending: true,
    onSale: true,
    colors: ["#1e293b", "#a855f7"],
    rating: 4.6,
    reviewsCount: 892,
    images: ["https://picsum.photos/seed/pulse/700/700"],
    isActive: true,
  },
  {
    name: "Trail Blaze Running Shoes",
    brand: "Vertex Sports",
    category: "Sports & Outdoors",
    categorySlug: "sports-outdoors",
    description: "Lightweight trail runners with responsive cushioning and aggressive grip.",
    features: ["Breathable mesh", "Responsive foam", "Trail-grip outsole"],
    price: 119,
    stock: 18,
    sku: "VTX-SHO-005",
    tags: ["running", "shoes", "sports"],
    isNew: true,
    sizes: ["7", "8", "9", "10", "11"],
    colors: ["#ef4444", "#1e293b"],
    rating: 4.4,
    reviewsCount: 96,
    images: ["https://picsum.photos/seed/trail/700/700"],
    isActive: true,
  },
];

async function seed() {
  await mongoose.connect(config.db.uri, { serverSelectionTimeoutMS: 10000 });
  console.log("[seed-data] Connected to DB");

  for (const cat of categories) {
    await Category.findOneAndUpdate(
      { name: cat.name },
      { $setOnInsert: { ...cat, slug: createSlug(cat.name) } },
      { upsert: true, new: true }
    );
  }
  console.log(`[seed-data] Categories: ${categories.length}`);

  for (const p of testProducts) {
    const slug = createSlug(p.name);
    await Product.findOneAndUpdate(
      { slug },
      { $setOnInsert: { ...p, slug } },
      { upsert: true, new: true }
    );
  }
  console.log(`[seed-data] Test products: ${testProducts.length}`);

  console.log("[seed-data] Done!");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("[seed-data] Failed:", err);
  process.exit(1);
});
