/**
 * Delete all products from the database (catalog wipe only).
 * Usage: npm run clear:products
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../src/modules/products/products.model.js";

dotenv.config();

const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/novamart";

async function main() {
  await mongoose.connect(uri);
  const { deletedCount } = await Product.deleteMany({});
  console.log(`[clear-products] Deleted ${deletedCount} product(s).`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("[clear-products] Failed:", err.message);
  process.exit(1);
});
