/**
 * Seed Veya (cosmetic store) categories + optional demo products.
 * Run: node scripts/seed-cosmetic-catalog.js  (from Backend/)
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import Store from "../src/modules/stores/stores.model.js";
import Category from "../src/modules/categories/categories.model.js";
import Product from "../src/modules/products/products.model.js";
import { createSlug } from "../src/utils/slugify.js";

dotenv.config();

const CATEGORIES = [
  {
    name: "Skincare",
    description: "Daily face care — cleansers, toners, and essentials.",
    image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&h=800&fit=crop",
    featured: true,
    order: 1,
  },
  {
    name: "Serums",
    description: "Concentrated treatments for hydration and renewal.",
    image: "https://images.unsplash.com/photo-1620916567198-39e8c1454c2d?w=600&h=800&fit=crop",
    featured: true,
    order: 2,
  },
  {
    name: "Moisturizers",
    description: "Forest-inspired creams and balms for every skin type.",
    image: "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=600&h=800&fit=crop",
    featured: false,
    order: 3,
  },
  {
    name: "Body Care",
    description: "Lotions, oils, and rituals from root to canopy.",
    image: "https://images.unsplash.com/photo-1608245449226-30c0ec0e0866?w=600&h=800&fit=crop",
    featured: false,
    order: 4,
  },
];

const DEMO_PRODUCTS = [
  {
    name: "Moss & Spruce Hydrating Serum",
    brand: "Veya",
    category: "Serums",
    categorySlug: "serums",
    description: "Lightweight serum with moss extract and spruce water for calm, hydrated skin.",
    features: ["Moss extract", "Spruce water", "Vegan formula"],
    price: 42,
    compareAtPrice: 52,
    stock: 30,
    sku: "VEYA-SER-001",
    tags: ["Bestseller", "New"],
    isFeatured: true,
    isNew: true,
    images: ["https://images.unsplash.com/photo-1620916567198-39e8c1454c2d?w=700&h=900&fit=crop"],
    position: 1,
  },
  {
    name: "Forest Dew Moisturizer",
    brand: "Veya",
    category: "Moisturizers",
    categorySlug: "moisturizers",
    description: "Silky daily cream with sage and cedar notes for soft, balanced skin.",
    features: ["Sage extract", "All-day hydration", "Sensitive-skin friendly"],
    price: 38,
    stock: 25,
    sku: "VEYA-MOI-001",
    tags: ["Daily essential"],
    isFeatured: true,
    images: ["https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=700&h=900&fit=crop"],
    position: 2,
  },
];

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const cosmetic = await Store.findOne({ slug: "cosmetic" });
  if (!cosmetic) throw new Error('Store "cosmetic" not found. Run seed-stores.js first.');

  const categoryMap = new Map();
  for (const cat of CATEGORIES) {
    const slug = createSlug(cat.name);
    const doc = await Category.findOneAndUpdate(
      { storeId: cosmetic._id, slug },
      {
        $set: {
          storeId: cosmetic._id,
          name: cat.name,
          slug,
          description: cat.description,
          image: cat.image,
          featured: cat.featured,
          order: cat.order,
          isActive: true,
        },
      },
      { upsert: true, new: true }
    );
    categoryMap.set(slug, doc);
    console.log(`Category ready: ${cat.name}`);
  }

  let created = 0;
  for (const p of DEMO_PRODUCTS) {
    const slug = createSlug(p.name);
    const cat = categoryMap.get(p.categorySlug);
    await Product.findOneAndUpdate(
      { storeId: cosmetic._id, slug },
      {
        $set: {
          ...p,
          storeId: cosmetic._id,
          slug,
          categoryRef: cat?._id ?? null,
          isActive: true,
          rating: 4.7,
          reviewsCount: 12,
        },
      },
      { upsert: true, new: true }
    );
    created += 1;
    console.log(`Product ready: ${p.name}`);
  }

  for (const [, cat] of categoryMap) {
    const count = await Product.countDocuments({
      storeId: cosmetic._id,
      categorySlug: cat.slug,
      isActive: true,
    });
    await Category.updateOne({ _id: cat._id }, { $set: { count } });
  }

  console.log(`Done. Categories: ${CATEGORIES.length}, demo products: ${created}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
