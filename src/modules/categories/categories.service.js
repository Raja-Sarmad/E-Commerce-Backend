import Category from "./categories.model.js";
import Product from "../products/products.model.js";
import AppError from "../../utils/AppError.js";
import { createSlug } from "../../utils/slugify.js";
import { getPagination, getPaginationMeta, getSort } from "../../utils/pagination.js";
import {
  stableQueryKey,
  getCatalogCache,
  setCatalogCache,
  clearCatalogCache,
} from "../../utils/catalogCache.js";

async function attachLiveProductCounts(categories, { admin = false, storeId } = {}) {
  if (!categories.length) return categories;

  const productFilter = { storeId };
  if (!admin) productFilter.isActive = true;
  const counts = await Product.aggregate([
    { $match: productFilter },
    { $group: { _id: "$categorySlug", count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((row) => [row._id, row.count]));

  return categories.map((category) => ({
    ...category,
    count: countMap[category.slug] ?? 0,
  }));
}

async function listCategories(query, { admin = false, storeId } = {}) {
  if (!storeId) throw new AppError("Store context is required.", 500);

  if (!admin) {
    const cacheKey = stableQueryKey(query);
    const cached = getCatalogCache(storeId, "categories", cacheKey);
    if (cached) return cached;
  }

  const { page, limit, skip } = getPagination(query);
  const sort = getSort(query, ["name", "createdAt", "order", "count"]);

  const filter = { storeId };
  if (!admin) filter.isActive = true;
  if (query.search) filter.name = new RegExp(query.search.trim(), "i");
  if (query.featured === "true") filter.featured = true;

  const [rows, total] = await Promise.all([
    Category.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Category.countDocuments(filter),
  ]);

  const categories = await attachLiveProductCounts(rows, { admin, storeId });

  const result = {
    categories,
    meta: getPaginationMeta({ page, limit, total, totalPages: Math.ceil(total / limit) }),
  };

  if (!admin) {
    setCatalogCache(storeId, "categories", stableQueryKey(query), result);
  }

  return result;
}

async function listAllCategories({ admin = false, storeId } = {}) {
  if (!storeId) throw new AppError("Store context is required.", 500);

  if (!admin) {
    const cached = getCatalogCache(storeId, "categories-all", "public");
    if (cached) return cached;
  }

  const filter = { storeId };
  if (!admin) filter.isActive = true;
  const categories = await Category.find(filter).sort({ order: 1, name: 1 }).lean();
  const result = await attachLiveProductCounts(categories, { admin, storeId });

  if (!admin) {
    setCatalogCache(storeId, "categories-all", "public", result);
  }

  return result;
}

async function getCategoryById(id, storeId) {
  const filter = { _id: id };
  if (storeId) filter.storeId = storeId;
  const category = await Category.findOne(filter);
  if (!category) throw new AppError("Category not found.", 404);
  return category;
}

async function getCategoryBySlug(slug, storeId) {
  const cached = getCatalogCache(storeId, "category-slug", slug);
  if (cached) return cached;

  const category = await Category.findOne({ slug, storeId, isActive: true });
  if (!category) throw new AppError("Category not found.", 404);
  setCatalogCache(storeId, "category-slug", slug, category);
  return category;
}

async function createCategory(data, storeId) {
  if (!storeId) throw new AppError("Store context is required.", 500);
  const slug = data.slug || createSlug(data.name);
  const category = await Category.create({ ...data, slug, storeId });
  clearCatalogCache();
  return category;
}

async function updateCategory(id, data, storeId) {
  const category = await getCategoryById(id, storeId);
  if (data.slug) data.slug = createSlug(data.slug);
  const allowed = [
    "name", "slug", "description", "image", "publicId", "icon",
    "featured", "isActive", "parent", "order",
  ];
  allowed.forEach((k) => {
    if (data[k] !== undefined) category[k] = data[k];
  });
  await category.save();
  clearCatalogCache();
  return category;
}

async function deleteCategory(id, storeId) {
  const category = await Category.findOneAndDelete({ _id: id, storeId });
  if (!category) throw new AppError("Category not found.", 404);
  await Category.updateMany({ parent: id, storeId }, { $unset: { parent: "" } });
  clearCatalogCache();
  return category;
}

export {
  listCategories,
  listAllCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
};
