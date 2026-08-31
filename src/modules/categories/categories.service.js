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

async function attachLiveProductCounts(categories, { admin = false } = {}) {
  if (!categories.length) return categories;

  const productFilter = admin ? {} : { isActive: true };
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

async function listCategories(query, { admin = false } = {}) {
  if (!admin) {
    const cacheKey = stableQueryKey(query);
    const cached = getCatalogCache("categories", cacheKey);
    if (cached) return cached;
  }

  const { page, limit, skip } = getPagination(query);
  const sort = getSort(query, ["name", "createdAt", "order", "count"]);

  const filter = {};
  if (!admin) filter.isActive = true;
  if (query.search) filter.name = new RegExp(query.search.trim(), "i");
  if (query.featured === "true") filter.featured = true;

  const [rows, total] = await Promise.all([
    Category.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Category.countDocuments(filter),
  ]);

  const categories = await attachLiveProductCounts(rows, { admin });

  const result = {
    categories,
    meta: getPaginationMeta({ page, limit, total, totalPages: Math.ceil(total / limit) }),
  };

  if (!admin) {
    setCatalogCache("categories", stableQueryKey(query), result);
  }

  return result;
}

async function listAllCategories({ admin = false } = {}) {
  if (!admin) {
    const cached = getCatalogCache("categories-all", "public");
    if (cached) return cached;
  }

  const filter = admin ? {} : { isActive: true };
  const categories = await Category.find(filter).sort({ order: 1, name: 1 }).lean();
  const result = await attachLiveProductCounts(categories, { admin });

  if (!admin) {
    setCatalogCache("categories-all", "public", result);
  }

  return result;
}

async function getCategoryById(id) {
  const category = await Category.findById(id);
  if (!category) throw new AppError("Category not found.", 404);
  return category;
}

async function getCategoryBySlug(slug) {
  const cached = getCatalogCache("category-slug", slug);
  if (cached) return cached;

  const category = await Category.findOne({ slug, isActive: true });
  if (!category) throw new AppError("Category not found.", 404);
  setCatalogCache("category-slug", slug, category);
  return category;
}

async function createCategory(data) {
  const slug = data.slug || createSlug(data.name);
  const category = await Category.create({ ...data, slug });
  clearCatalogCache();
  return category;
}

async function updateCategory(id, data) {
  const category = await Category.findById(id);
  if (!category) throw new AppError("Category not found.", 404);
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

async function deleteCategory(id) {
  const category = await Category.findByIdAndDelete(id);
  if (!category) throw new AppError("Category not found.", 404);
  await Category.updateMany({ parent: id }, { $unset: { parent: "" } });
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
