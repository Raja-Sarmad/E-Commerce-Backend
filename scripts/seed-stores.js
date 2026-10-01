/**
 * Seed ecommerce + cosmetic stores and assign existing catalog data to ecommerce.
 * Run: node scripts/seed-stores.js  (from Backend/)
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import Store from "../src/modules/stores/stores.model.js";
import Product from "../src/modules/products/products.model.js";
import Category from "../src/modules/categories/categories.model.js";
import Order from "../src/modules/orders/orders.model.js";
import Reel from "../src/modules/reels/reels.model.js";
import User from "../src/modules/users/users.model.js";
import { createSlug } from "../src/utils/slugify.js";

dotenv.config();

const VEYA_USERS = [
  { name: "Veya Admin", email: "admin@veya.com", password: "Veya@123456", role: "admin" },
  { name: "Veya Customer", email: "customer@veya.com", password: "Veya@123456", role: "customer" },
];

const VEYA_CATEGORIES = [
  { name: "Skincare", description: "Daily face care essentials.", order: 1, featured: true },
  { name: "Serums", description: "Concentrated skin treatments.", order: 2, featured: true },
  { name: "Moisturizers", description: "Creams and balms for hydration.", order: 3, featured: false },
  { name: "Body Care", description: "Body lotions, oils, and rituals.", order: 4, featured: false },
];

const STORES = [
  { slug: "ecommerce", name: "NovaMart E-Commerce" },
  { slug: "cosmetic", name: "Veya Cosmetic" },
];

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  for (const s of STORES) {
    await Store.findOneAndUpdate({ slug: s.slug }, s, { upsert: true, new: true });
    console.log(`Store ready: ${s.slug}`);
  }

  const ecommerce = await Store.findOne({ slug: "ecommerce" });
  const cosmetic = await Store.findOne({ slug: "cosmetic" });
  if (!ecommerce || !cosmetic) throw new Error("Stores missing after seed");

  const productRes = await Product.updateMany(
    { $or: [{ storeId: { $exists: false } }, { storeId: null }] },
    { $set: { storeId: ecommerce._id } }
  );
  const catRes = await Category.updateMany(
    { $or: [{ storeId: { $exists: false } }, { storeId: null }] },
    { $set: { storeId: ecommerce._id } }
  );
  const orderRes = await Order.updateMany(
    { $or: [{ storeId: { $exists: false } }, { storeId: null }] },
    { $set: { storeId: ecommerce._id } }
  );
  const reelRes = await Reel.updateMany(
    { $or: [{ storeId: { $exists: false } }, { storeId: null }] },
    { $set: { storeId: ecommerce._id } }
  );

  console.log(`Products migrated: ${productRes.modifiedCount}`);
  console.log(`Categories migrated: ${catRes.modifiedCount}`);
  console.log(`Orders migrated: ${orderRes.modifiedCount}`);
  console.log(`Reels migrated: ${reelRes.modifiedCount}`);

  for (const u of VEYA_USERS) {
    const hashed = await bcrypt.hash(u.password, 10);
    await User.findOneAndUpdate(
      { email: u.email },
      { name: u.name, email: u.email, password: hashed, role: u.role, isActive: true },
      { upsert: true, new: true }
    );
    console.log(`Veya user ready: ${u.email}`);
  }

  for (const cat of VEYA_CATEGORIES) {
    const slug = createSlug(cat.name);
    await Category.findOneAndUpdate(
      { storeId: cosmetic._id, slug },
      {
        $set: {
          storeId: cosmetic._id,
          name: cat.name,
          slug,
          description: cat.description,
          order: cat.order,
          featured: cat.featured,
          isActive: true,
        },
      },
      { upsert: true, new: true }
    );
    console.log(`Veya category ready: ${cat.name}`);
  }

  console.log("Done.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
