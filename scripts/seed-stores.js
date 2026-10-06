/**
 * Seed NovaMart and Store tenants and assign existing catalog data to ecommerce.
 * Run: node scripts/seed-stores.js  (from Backend/)
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import Store from "../src/modules/stores/stores.model.js";
import Product from "../src/modules/products/products.model.js";
import Category from "../src/modules/categories/categories.model.js";
import Order from "../src/modules/orders/orders.model.js";
import Reel from "../src/modules/reels/reels.model.js";

dotenv.config();

const STORES = [
  { slug: "ecommerce", name: "NovaMart" },
  { slug: "store", name: "Overdose Store" },
];

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  for (const s of STORES) {
    await Store.findOneAndUpdate({ slug: s.slug }, s, { upsert: true, new: true });
    console.log(`Store ready: ${s.slug}`);
  }
  const ecommerce = await Store.findOne({ slug: "ecommerce" });
  if (!ecommerce) throw new Error("Store missing after seed");

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

  console.log("Done.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
