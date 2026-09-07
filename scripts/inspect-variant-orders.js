import mongoose from "mongoose";
import config from "../src/config/index.js";
import Order from "../src/modules/orders/orders.model.js";
import Product from "../src/modules/products/products.model.js";

async function main() {
  await mongoose.connect(config.db.uri);
  console.log("Connected to:", config.db.uri.replace(/(:\/\/[^:]+:)[^@]+@/, "$1***@"));

  const orders = await Order.find({}).sort({ createdAt: -1 }).limit(8).lean();
  console.log(`\n=== ${orders.length} most recent orders ===`);
  for (const o of orders) {
    console.log(`\nOrder ${o.number}  status=${o.status}  ${o.createdAt.toISOString()}`);
    for (const it of o.items) {
      console.log(
        `  - ${it.name}  qty=${it.quantity}  size=${it.size ?? "(none)"}  color=${it.color ?? "(none)"}`
      );
    }
  }

  const variantProducts = await Product.find({
    "variants.0": { $exists: true },
  })
    .select("name stock sizes variants")
    .lean();

  console.log(`\n=== ${variantProducts.length} products with variants ===`);
  for (const p of variantProducts) {
    const sums = p.variants.map((v) => `${v.size}=${v.stock}`);
    console.log(
      `\n${p.name}\n  flat.stock=${p.stock}  sizes=${p.sizes?.join(",")}  variants=[${sums.join(", ")}]  sum(variants)=${p.variants.reduce((s, v) => s + (v.stock || 0), 0)}`
    );
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Inspect failed:", err.message);
  process.exit(1);
});