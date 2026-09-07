import InventoryEntry from "./inventory.model.js";
import Product from "../products/products.model.js";
import AppError from "../../utils/AppError.js";
import { getPagination, getPaginationMeta, getSort } from "../../utils/pagination.js";
import { applyDateRangeFilter } from "../../utils/dateRange.js";
import { checkLowStock } from "../notifications/notifications.service.js";

async function listHistory(query) {
  const { page, limit, skip } = getPagination(query);
  const sort = getSort(query, ["createdAt", "productName"]);

  const filter = {};
  if (query.product) filter.product = query.product;
  if (query.search) filter.$or = [{ productName: new RegExp(query.search.trim(), "i") }, { sku: new RegExp(query.search.trim(), "i") }];
  if (query.direction === "in") filter.adjustment = { $gt: 0 };
  if (query.direction === "out") filter.adjustment = { $lt: 0 };
  applyDateRangeFilter(filter, query);

  const [entries, total] = await Promise.all([
    InventoryEntry.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    InventoryEntry.countDocuments(filter),
  ]);

  return {
    entries,
    meta: getPaginationMeta({ page, limit, total, totalPages: Math.ceil(total / limit) }),
  };
}

async function adjustStock(productId, adjustment, reason = "", actor = "System", size = null) {
  const product = await Product.findById(productId);
  if (!product) throw new AppError("Product not found.", 404);

  if (size && product.variants && product.variants.length > 0) {
    // Variant-level adjustment
    const variant = product.variants.find((v) => v.size === size);
    if (!variant) throw new AppError(`Variant "${size}" not found.`, 404);
    if (variant.stock + adjustment < 0) {
      throw new AppError("Adjustment would make variant stock negative.", 400);
    }
    const previous = variant.stock;
    variant.stock += adjustment;
    await product.save(); // triggers pre-save hook to sync total stock

    await InventoryEntry.create({
      product: product._id,
      productName: product.name,
      sku: product.sku || "",
      previous,
      adjustment,
      current: variant.stock,
      reason: reason ? `${reason} (size: ${size})` : `Size: ${size}`,
      user: actor,
    });
  } else {
    // Product-level adjustment
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
  }

  await checkLowStock(product);
  return product;
}

async function listLowStock(query = {}) {
  const threshold = query.threshold ? Number(query.threshold) : 10;
  const products = await Product.find({
    $or: [
      { stock: { $gt: 0, $lte: threshold } },
      { variants: { $elemMatch: { stock: { $gt: 0, $lte: threshold } } } },
    ],
  })
    .sort({ stock: 1 })
    .limit(100)
    .lean();
  return { products, threshold };
}

export { listHistory, adjustStock, listLowStock };
