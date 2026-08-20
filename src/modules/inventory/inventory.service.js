import InventoryEntry from "./inventory.model.js";
import Product from "../products/products.model.js";
import AppError from "../../utils/AppError.js";
import { getPagination, getPaginationMeta, getSort } from "../../utils/pagination.js";
import { checkLowStock } from "../notifications/notifications.service.js";

async function listHistory(query) {
  const { page, limit, skip } = getPagination(query);
  const sort = getSort(query, ["createdAt", "productName"]);

  const filter = {};
  if (query.product) filter.product = query.product;
  if (query.search) filter.$or = [{ productName: new RegExp(query.search.trim(), "i") }, { sku: new RegExp(query.search.trim(), "i") }];

  const [entries, total] = await Promise.all([
    InventoryEntry.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    InventoryEntry.countDocuments(filter),
  ]);

  return {
    entries,
    meta: getPaginationMeta({ page, limit, total, totalPages: Math.ceil(total / limit) }),
  };
}

async function adjustStock(productId, adjustment, reason = "", actor = "System") {
  const product = await Product.findById(productId);
  if (!product) throw new AppError("Product not found.", 404);
  if (product.stock + adjustment < 0) {
    throw new AppError("Adjustment would make stock negative.", 400);
  }

  const previous = product.stock;
  product.stock += adjustment;
  await product.save();

  await InventoryEntry.create({
    product: product._id,
    productName: product.name,
    sku: product.sku || "",
    previous,
    adjustment,
    current: product.stock,
    reason,
    user: actor,
  });

  await checkLowStock(product);
  return product;
}

async function listLowStock(query = {}) {
  const threshold = query.threshold ? Number(query.threshold) : 10;
  const products = await Product.find({ stock: { $lte: threshold } })
    .sort({ stock: 1 })
    .limit(100)
    .lean();
  return { products, threshold };
}

export { listHistory, adjustStock, listLowStock };
