import Category from "./categories.model.js";
import AppError from "../../utils/AppError.js";
import { createSlug } from "../../utils/slugify.js";
import { getPagination, getPaginationMeta, getSort } from "../../utils/pagination.js";

async function listCategories(query, { admin = false } = {}) {
  const { page, limit, skip } = getPagination(query);
  const sort = getSort(query, ["name", "createdAt", "order", "count"]);

  const filter = {};
  if (!admin) filter.isActive = true;
  if (query.search) filter.name = new RegExp(query.search.trim(), "i");
  if (query.featured === "true") filter.featured = true;

  const [categories, total] = await Promise.all([
    Category.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Category.countDocuments(filter),
  ]);

  return {
    categories,
    meta: getPaginationMeta({ page, limit, total, totalPages: Math.ceil(total / limit) }),
  };
}

async function listAllCategories({ admin = false } = {}) {
  const filter = admin ? {} : { isActive: true };
  return Category.find(filter).sort({ order: 1, name: 1 }).lean();
}

async function getCategoryById(id) {
  const category = await Category.findById(id);
  if (!category) throw new AppError("Category not found.", 404);
  return category;
}

async function getCategoryBySlug(slug) {
  const category = await Category.findOne({ slug, isActive: true });
  if (!category) throw new AppError("Category not found.", 404);
  return category;
}

async function createCategory(data) {
  const slug = data.slug || createSlug(data.name);
  const category = await Category.create({ ...data, slug });
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
  return category;
}

async function deleteCategory(id) {
  const category = await Category.findByIdAndDelete(id);
  if (!category) throw new AppError("Category not found.", 404);
  await Category.updateMany({ parent: id }, { $unset: { parent: "" } });
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
