import Brand from "./brands.model.js";
import AppError from "../../utils/AppError.js";
import { createSlug } from "../../utils/slugify.js";
import { getPagination, getPaginationMeta, getSort } from "../../utils/pagination.js";
import {
  stableQueryKey,
  getCatalogCache,
  setCatalogCache,
  clearCatalogCache,
} from "../../utils/catalogCache.js";

async function listBrands(query, { admin = false } = {}) {
  if (!admin) {
    const cacheKey = stableQueryKey(query);
    const cached = getCatalogCache("brands", cacheKey);
    if (cached) return cached;
  }

  const { page, limit, skip } = getPagination(query);
  const sort = getSort(query, ["name", "createdAt"]);

  const filter = {};
  if (!admin) filter.isActive = true;
  if (query.search) filter.name = new RegExp(query.search.trim(), "i");

  const [brands, total] = await Promise.all([
    Brand.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Brand.countDocuments(filter),
  ]);

  const result = {
    brands,
    meta: getPaginationMeta({ page, limit, total, totalPages: Math.ceil(total / limit) }),
  };

  if (!admin) {
    setCatalogCache("brands", stableQueryKey(query), result);
  }

  return result;
}

async function listAllBrands() {
  const cached = getCatalogCache("brands-all", "public");
  if (cached) return cached;

  const brands = await Brand.find({ isActive: true }).sort({ name: 1 }).lean();
  setCatalogCache("brands-all", "public", brands);
  return brands;
}

async function getBrandById(id) {
  const brand = await Brand.findById(id);
  if (!brand) throw new AppError("Brand not found.", 404);
  return brand;
}

async function createBrand(data) {
  const slug = data.slug || createSlug(data.name);
  const brand = await Brand.create({ ...data, slug });
  clearCatalogCache();
  return brand;
}

async function updateBrand(id, data) {
  const brand = await Brand.findById(id);
  if (!brand) throw new AppError("Brand not found.", 404);
  if (data.slug) data.slug = createSlug(data.slug);
  const allowed = ["name", "slug", "logo", "publicId", "description", "isActive"];
  allowed.forEach((k) => {
    if (data[k] !== undefined) brand[k] = data[k];
  });
  await brand.save();
  clearCatalogCache();
  return brand;
}

async function deleteBrand(id) {
  const brand = await Brand.findByIdAndDelete(id);
  if (!brand) throw new AppError("Brand not found.", 404);
  clearCatalogCache();
  return brand;
}

export { listBrands, listAllBrands, getBrandById, createBrand, updateBrand, deleteBrand };
