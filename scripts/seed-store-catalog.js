/** Add the Overdose clothing demo catalog without replacing existing products. */
import mongoose from "mongoose";
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { URL } from "node:url";
import config from "../src/config/index.js";
import { connectDB, disconnectDB } from "../src/config/db.js";
import Store from "../src/modules/stores/stores.model.js";
import Category from "../src/modules/categories/categories.model.js";
import Product from "../src/modules/products/products.model.js";
import { createSlug } from "../src/utils/slugify.js";

const photo = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=85`;
const collections = [
  { name: "Everyday Dresses", image: photo("photo-1515886657613-9f3515b0c78f"), description: "Easy silhouettes for everyday plans." },
  { name: "Evening Edit", image: photo("photo-1566174053879-31528523f8ae"), description: "Statement dresses for after-dark occasions." },
  { name: "Summer Florals", image: photo("photo-1496747611176-843222e1e57c"), description: "Light fabrics and fresh floral prints." },
  { name: "Premium Occasionwear", image: photo("photo-1515372039744-b8f02a3ae446"), description: "Refined occasion dresses with special finishes." },
  { name: "Men's Essentials", image: photo("photo-1521572267360-ee0c2909d518"), description: "Everyday tees and essentials for men." },
  { name: "Men's Streetwear", image: photo("photo-1556905055-8f358a7a47b2"), description: "Relaxed layers and streetwear staples for men." },
];

// name, collection, price, original price, new arrival, manual bestseller
const dresses = [
  ["Noor Everyday Midi Dress", 0, 59, 79, false, true],
  ["Dune Cotton Shirt Dress", 0, 65, null, true, false],
  ["Olive Wrap Dress", 0, 54, 72, false, false],
  ["Sana Relaxed Maxi Dress", 0, 69, null, true, false],
  ["Midnight Satin Evening Dress", 1, 119, null, false, true],
  ["Ruby Pleated Occasion Dress", 1, 99, 135, true, false],
  ["Luna Black Slip Dress", 1, 89, null, true, false],
  ["Amara Velvet Dress", 1, 109, 149, false, false],
  ["Gul Floral Summer Dress", 2, 79, null, false, true],
  ["Daisy Tie-Waist Midi", 2, 59, 79, true, false],
  ["Meadow Linen Maxi", 2, 85, null, true, false],
  ["Rose Garden Day Dress", 2, 69, null, false, false],
  ["Zara Premium Embroidered Gown", 3, 189, null, false, true],
  ["Pearl Premium Occasion Dress", 3, 169, 219, true, false],
  ["Ayla Premium Silk Maxi", 3, 199, null, true, false],
  ["Royal Premium Pleated Gown", 3, 179, null, false, false],
];

const menswear = [
  ["Core Oversized Tee", 4, 34, 45, true, true, "OD-MEN-001", ["black", "white"]],
  ["Essential Tee", 4, 32, null, false, true, "OD-MEN-002", ["white", "grey"]],
  ["Heavyweight Oversized Tee", 4, 45, null, true, false, "OD-MEN-003", ["black", "grey"]],
  ["Logo Hoodie", 5, 59, 75, false, true, "OD-MEN-004", ["black", "grey"]],
  ["Minimal Crewneck", 5, 49, null, true, false, "OD-MEN-005", ["black", "white"]],
  ["Everyday Utility Jacket", 5, 69, null, false, false, "OD-MEN-006", ["black", "olive"]],
];

async function seed() {
  // Keep demo images local so pages do not depend on third-party image requests.
  const imageDir = path.join(config.uploadsDir, "store-demo");
  await mkdir(imageDir, { recursive: true });
  for (const collection of collections) {
    const filename = `${new URL(collection.image).pathname.slice(1)}.jpg`;
    const destination = path.join(imageDir, filename);
    try {
      await access(destination);
    } catch {
      const response = await fetch(collection.image, { signal: globalThis.AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error(`Demo image download failed: ${response.status}`);
      await writeFile(destination, Buffer.from(await response.arrayBuffer()));
    }
    collection.image = `${config.serverUrl.replace(/\/$/, "")}/uploads/store-demo/${filename}`;
  }
  await connectDB();
  const store = await Store.findOneAndUpdate(
    { slug: "store" },
    { $setOnInsert: { name: "Overdose Store", slug: "store", isActive: true } },
    { upsert: true, new: true },
  );
  const categories = [];
  for (const [order, collection] of collections.entries()) {
    const slug = createSlug(collection.name);
    let category = await Category.findOne({ storeId: store._id, slug });
    if (!category) category = await Category.create({ ...collection, storeId: store._id, slug, order, isActive: true });
    categories.push(category);
  }
  let created = 0;
  for (const [index, [name, group, price, compareAtPrice, isNew, isBestSeller]] of dresses.entries()) {
    const sku = `OD-DRESS-${String(index + 1).padStart(3, "0")}`;
    if (await Product.exists({ storeId: store._id, sku })) continue;
    const category = categories[group];
    await Product.create({
      name, sku, storeId: store._id, slug: createSlug(name), brand: "Overdose",
      gender: "women",
      category: category.name, categorySlug: category.slug, categoryRef: category._id,
      description: `${name}. ${collections[group].description} Available in sizes S to XL.`,
      price, compareAtPrice, isNew, isBestSeller, isFeatured: group === 3,
      tags: group === 3 ? ["Premium"] : [],
      images: [collections[group].image], wearType: "stitched",
      sizes: ["S", "M", "L", "XL"], variants: ["S", "M", "L", "XL"].map(size => ({ size, stock: 6 })),
      colors: ["black", "white"], position: index + 1, isActive: true,
    });
    created += 1;
  }
  let menCreated = 0;
  for (const [name, group, price, compareAtPrice, isNew, isBestSeller, sku, colors] of menswear) {
    if (await Product.exists({ storeId: store._id, sku })) continue;
    const category = categories[group];
    await Product.create({
      name, sku, storeId: store._id, slug: createSlug(name), brand: "Overdose", gender: "men",
      category: category.name, categorySlug: category.slug, categoryRef: category._id,
      description: `${name}. ${collections[group].description} Available in sizes S to XL.`,
      price, compareAtPrice, isNew, isBestSeller, isFeatured: false, tags: [],
      images: [category.image], wearType: "stitched",
      sizes: ["S", "M", "L", "XL"], variants: ["S", "M", "L", "XL"].map(size => ({ size, stock: 6 })),
      colors, position: dresses.length + menCreated + 1, isActive: true,
    });
    menCreated += 1;
  }
  console.log(`[seed-store-catalog] Store: store; collections: ${categories.length}; women's products added: ${created}; men's products added: ${menCreated}; existing products preserved.`);
}

try {
  await seed();
} catch (error) {
  console.error("[seed-store-catalog] Failed:", error.name, error.code || "");
  process.exitCode = 1;
} finally {
  if (mongoose.connection.readyState !== 0) await disconnectDB();
}
