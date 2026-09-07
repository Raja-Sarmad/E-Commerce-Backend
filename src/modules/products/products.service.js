import Product from "./products.model.js";
import Order from "../orders/orders.model.js";
import AppError from "../../utils/AppError.js";
import { createSlug } from "../../utils/slugify.js";
import { getPagination, getPaginationMeta, getSort } from "../../utils/pagination.js";
import { uploadMany, resolveRemoteImages, deleteFromCloudinary } from "../../utils/cloudinary.js";
import config from "../../config/index.js";
import { checkLowStock } from "../notifications/notifications.service.js";
import {
  stableQueryKey,
  getCatalogCache,
  setCatalogCache,
  clearCatalogCache,
} from "../../utils/catalogCache.js";

const productImageFolder = `${config.cloudinary.folder}/products`;

/**
 * Build a Mongo filter object from public query params.
 */
function buildPublicFilter(query) {
  const filter = { isActive: true };

  if (query.search) {
    filter.$text = { $search: query.search.trim() };
  }
  if (query.category) filter.category = query.category;
  if (query.categorySlug) filter.categorySlug = query.categorySlug;
  if (query.brand) filter.brand = query.brand;
  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }
  if (query.tags) {
    filter.tags = { $in: Array.isArray(query.tags) ? query.tags : [query.tags] };
  }
  if (query.featured === "true") filter.isFeatured = true;
  if (query.bestSeller === "true") {
    filter.$or = [{ totalSold: { $gt: 0 } }, { isBestSeller: true }];
  }
  if (query.trending === "true") filter.isTrending = true;
  if (query.onSale === "true") filter.onSale = true;
  if (query.inStock === "true") {
    filter.$or = [{ stock: { $gt: 0 } }, { "variants.stock": { $gt: 0 } }];
  }
  if (query.colors) filter.colors = { $in: [query.colors] };

  return filter;
}

let totalSoldSynced = false;

async function syncTotalSoldFromOrders() {
  const rows = await Order.aggregate([
    { $match: { status: { $nin: ["cancelled"] } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.productId",
        totalSold: { $sum: "$items.quantity" },
      },
    },
  ]);

  await Product.updateMany({}, { $set: { totalSold: 0 } });
  if (rows.length) {
    await Product.bulkWrite(
      rows.map((row) => ({
        updateOne: {
          filter: { _id: row._id },
          update: { $set: { totalSold: row.totalSold } },
        },
      }))
    );
  }
  totalSoldSynced = true;
}

async function ensureTotalSoldSynced() {
  if (totalSoldSynced) return;
  const hasOrders = await Order.exists({ status: { $nin: ["cancelled"] } });
  if (!hasOrders) {
    totalSoldSynced = true;
    return;
  }
  const hasSold = await Product.exists({ totalSold: { $gt: 0 } });
  if (hasSold) {
    totalSoldSynced = true;
    return;
  }
  await syncTotalSoldFromOrders();
}

function buildAdminFilter(query) {
  const filter = {};
  if (query.isActive !== undefined) filter.isActive = query.isActive === "true";
  if (query.search) {
    filter.$or = [
      { name: new RegExp(query.search.trim(), "i") },
      { sku: new RegExp(query.search.trim(), "i") },
    ];
  }
  if (query.category) filter.category = query.category;
  if (query.brand) filter.brand = query.brand;
  if (query.stockStatus === "low") {
    const t = query.threshold ? Number(query.threshold) : 10;
    filter.$or = [
      { stock: { $gt: 0, $lte: t } },
      { variants: { $elemMatch: { stock: { $gt: 0, $lte: t } } } },
    ];
  }
  if (query.stockStatus === "out") {
    filter.$and = [
      { stock: { $lte: 0 } },
      { $or: [{ variants: { $size: 0 } }, { variants: { $not: { $elemMatch: { stock: { $gt: 0 } } } } }] },
    ];
  }
  return filter;
}

async function listProducts(query, { admin = false } = {}) {
  if (!admin) {
    const cacheKey = stableQueryKey(query);
    const cached = getCatalogCache("products", cacheKey);
    if (cached) return cached;
  }

  if (!admin && query.bestSeller === "true") {
    await ensureTotalSoldSynced();
  }

  const { page, limit, skip } = getPagination(query);
  const sort = getSort(query, [
    "position", "createdAt", "price", "name", "rating", "reviewsCount", "stock", "totalSold",
  ]);
  const effectiveSort =
    query.bestSeller === "true" && !query.sort
      ? { totalSold: -1, reviewsCount: -1, createdAt: -1 }
      : sort;

  const filter = admin ? buildAdminFilter(query) : buildPublicFilter(query);

  const [products, total] = await Promise.all([
    Product.find(filter).sort(effectiveSort).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);

  const result = {
    products,
    meta: getPaginationMeta({ page, limit, total, totalPages: Math.ceil(total / limit) }),
  };

  if (!admin) {
    setCatalogCache("products", stableQueryKey(query), result);
  }

  return result;
}

async function getProductById(productId, { admin = false } = {}) {
  const filter = { _id: productId };
  if (!admin) filter.isActive = true;
  const product = await Product.findOne(filter);
  if (!product) throw new AppError("Product not found.", 404);
  return product;
}

async function getProductBySlug(slug, { admin = false } = {}) {
  const filter = { slug };
  if (!admin) filter.isActive = true;
  const product = await Product.findOne(filter);
  if (!product) throw new AppError("Product not found.", 404);
  return product;
}

async function getRelatedProducts(product, limit = 4) {
  return Product.find({
    _id: { $ne: product._id },
    isActive: true,
    $or: [
      { category: product.category },
      { tags: { $in: product.tags } },
      { brand: product.brand },
    ],
  })
    .limit(limit)
    .lean();
}

async function getProductWithRelatedBySlug(slug) {
  const cached = getCatalogCache("product-slug", slug);
  if (cached) return cached;

  const product = await getProductBySlug(slug);
  const related = await getRelatedProducts(product);
  const result = { product, related };
  setCatalogCache("product-slug", slug, result);
  return result;
}

/** Live stock lookup — never cached (used by cart/checkout and live UI). */
async function getStockByIds(ids = []) {
  const unique = [...new Set((Array.isArray(ids) ? ids : [ids]).filter(Boolean))];
  if (!unique.length) return [];

  const rows = await Product.find({ _id: { $in: unique }, isActive: true })
    .select("_id stock variants")
    .lean();

  const stockMap = new Map(rows.map((p) => [String(p._id), Math.max(0, p.stock ?? 0)]));
  const variantStockMap = new Map(
    rows.map((p) => [
      String(p._id),
      p.variants && p.variants.length > 0
        ? Object.fromEntries(p.variants.map((v) => [v.size, Math.max(0, v.stock ?? 0)]))
        : null,
    ])
  );

  return unique.map((id) => ({
    id: String(id),
    stock: stockMap.get(String(id)) ?? 0,
    variants: variantStockMap.get(String(id)) ?? undefined,
  }));
}

async function createProduct(data, files = []) {
  let urlImages = [];

  if (Array.isArray(data.images)) {
    urlImages = data.images.filter(Boolean);
  } else if (typeof data.images === "string" && data.images) {
    try {
      const parsed = JSON.parse(data.images);
      if (Array.isArray(parsed)) urlImages = parsed.filter(Boolean);
    } catch {
      urlImages = [data.images];
    }
  }

  if (data.imageUrls) {
    try {
      const parsed = JSON.parse(data.imageUrls);
      if (Array.isArray(parsed)) urlImages = [...urlImages, ...parsed.filter(Boolean)];
    } catch {
      // ignore
    }
  }

  const urlResults =
    urlImages.length > 0 ? await resolveRemoteImages(urlImages, productImageFolder) : [];

  let images = urlResults.map((u) => u.url);
  let publicIds = urlResults.filter((u) => u.publicId).map((u) => u.publicId);

  if (files && files.length) {
    const uploaded = await uploadMany(files, productImageFolder);
    images = [...images, ...uploaded.map((u) => u.url)];
    publicIds = [...publicIds, ...uploaded.map((u) => u.publicId)];
  }

  if (images.length === 0) {
    throw new AppError("At least one product image is required. Provide image URLs or upload files.", 400);
  }

  const slug = data.slug || createSlug(data.name);
  const cleanData = { ...data };
  delete cleanData.imageUrls;
  if (typeof cleanData.images === "string") delete cleanData.images;

  const booleanFields = ["isFeatured", "isBestSeller", "isNew", "isTrending", "onSale", "isActive"];
  booleanFields.forEach((k) => {
    if (cleanData[k] === "true") cleanData[k] = true;
    else if (cleanData[k] === "false") cleanData[k] = false;
  });

  const numberFields = ["price", "compareAtPrice", "stock", "lowStockThreshold", "discountPercent", "position"];
  numberFields.forEach((k) => {
    if (cleanData[k] !== undefined && cleanData[k] !== "") {
      const n = Number(cleanData[k]);
      cleanData[k] = k === "price" || k === "compareAtPrice" ? Math.max(0, n) : n;
    }
  });

  const arrayFields = ["features", "tags", "colors", "sizes"];
  arrayFields.forEach((k) => {
    if (!Array.isArray(cleanData[k])) {
      if (typeof cleanData[k] === "string" && cleanData[k]) {
        try {
          const parsed = JSON.parse(cleanData[k]);
          if (Array.isArray(parsed)) cleanData[k] = parsed;
          else cleanData[k] = [cleanData[k]];
        } catch {
          cleanData[k] = [cleanData[k]];
        }
      } else {
        cleanData[k] = [];
      }
    }
  });

  // Parse variants from JSON string if needed
  if (cleanData.variants && typeof cleanData.variants === "string") {
    try {
      const parsed = JSON.parse(cleanData.variants);
      if (Array.isArray(parsed)) cleanData.variants = parsed;
    } catch {
      cleanData.variants = [];
    }
  }
  if (!Array.isArray(cleanData.variants)) cleanData.variants = [];

  // Auto-sync stock from variants if variants are provided
  if (cleanData.variants.length > 0) {
    cleanData.stock = cleanData.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  }

  const product = await Product.create({ ...cleanData, slug, images, publicIds });

  await checkLowStock(product);
  clearCatalogCache();
  return product;
}

async function updateProduct(productId, data, files = []) {
  const product = await Product.findById(productId);
  if (!product) throw new AppError("Product not found.", 404);

  let newUrlImages = [];
  if (Array.isArray(data.images)) {
    newUrlImages = data.images.filter(Boolean);
  } else if (typeof data.images === "string" && data.images) {
    try {
      const parsed = JSON.parse(data.images);
      if (Array.isArray(parsed)) newUrlImages = parsed.filter(Boolean);
    } catch {
      newUrlImages = [data.images];
    }
  }

  if (data.imageUrls) {
    try {
      const parsed = JSON.parse(data.imageUrls);
      if (Array.isArray(parsed)) newUrlImages = [...newUrlImages, ...parsed.filter(Boolean)];
    } catch {
      // ignore
    }
  }

  const urlResults =
    newUrlImages.length > 0 ? await resolveRemoteImages(newUrlImages, productImageFolder) : [];

  let newImages = urlResults.map((u) => u.url);
  const newPublicIds = urlResults.filter((u) => u.publicId).map((u) => u.publicId);

  if (files && files.length) {
    const uploaded = await uploadMany(files, productImageFolder);
    newImages = [...newImages, ...uploaded.map((u) => u.url)];
    newPublicIds.push(...uploaded.map((u) => u.publicId));
  }

  if (newImages.length > 0) {
    product.images = newImages;
    product.publicIds = [...(product.publicIds || []), ...newPublicIds];
  }

  const cleanData = { ...data };
  delete cleanData.imageUrls;
  if (typeof cleanData.images === "string") delete cleanData.images;

  const booleanFields = ["isFeatured", "isBestSeller", "isNew", "isTrending", "onSale", "isActive"];
  booleanFields.forEach((k) => {
    if (cleanData[k] === "true") cleanData[k] = true;
    else if (cleanData[k] === "false") cleanData[k] = false;
  });

  const numberFields = ["price", "compareAtPrice", "stock", "lowStockThreshold", "discountPercent", "position"];
  numberFields.forEach((k) => {
    if (cleanData[k] !== undefined && cleanData[k] !== "") {
      const n = Number(cleanData[k]);
      cleanData[k] = k === "price" || k === "compareAtPrice" ? Math.max(0, n) : n;
    }
  });

  const arrayFields = ["features", "tags", "colors", "sizes"];
  arrayFields.forEach((k) => {
    if (!Array.isArray(cleanData[k])) {
      if (typeof cleanData[k] === "string" && cleanData[k]) {
        try {
          const parsed = JSON.parse(cleanData[k]);
          if (Array.isArray(parsed)) cleanData[k] = parsed;
          else cleanData[k] = [cleanData[k]];
        } catch {
          cleanData[k] = [cleanData[k]];
        }
      } else {
        cleanData[k] = [];
      }
    }
  });

  // Parse variants from JSON string if needed
  if (cleanData.variants && typeof cleanData.variants === "string") {
    try {
      const parsed = JSON.parse(cleanData.variants);
      if (Array.isArray(parsed)) cleanData.variants = parsed;
    } catch {
      cleanData.variants = [];
    }
  }

  // Auto-sync stock from variants if variants are provided
  if (Array.isArray(cleanData.variants) && cleanData.variants.length > 0) {
    cleanData.stock = cleanData.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  }

  const allowed = [
    "name", "slug", "brand", "brandRef", "category", "categoryRef", "categorySlug",
    "description", "features", "specifications", "price", "compareAtPrice",
    "stock", "lowStockThreshold", "sku", "tags", "isFeatured", "isBestSeller",
    "isNew", "isTrending", "colors", "sizes", "variants", "position", "isActive", "vendor",
  ];
  allowed.forEach((k) => {
    if (cleanData[k] !== undefined) product[k] = cleanData[k];
  });

  if (data.slug) product.slug = createSlug(data.slug);
  if (!product.slug) product.slug = createSlug(product.name);

  await product.save();
  await checkLowStock(product);
  clearCatalogCache();
  return product;
}

async function deleteProduct(productId) {
  const product = await Product.findById(productId);
  if (!product) throw new AppError("Product not found.", 404);

  for (const publicId of product.publicIds || []) {
    await deleteFromCloudinary(publicId);
  }
  await product.deleteOne();
  clearCatalogCache();
  return product;
}

async function removeImage(productId, publicId) {
  const product = await Product.findById(productId);
  if (!product) throw new AppError("Product not found.", 404);
  product.images = product.images.filter(
    (_url, i) => product.publicIds[i] !== publicId
  );
  product.publicIds = product.publicIds.filter((p) => p !== publicId);
  await deleteFromCloudinary(publicId);
  await product.save();
  clearCatalogCache();
  return product;
}

export {
  listProducts,
  getProductById,
  getProductBySlug,
  getProductWithRelatedBySlug,
  getRelatedProducts,
  getStockByIds,
  createProduct,
  updateProduct,
  deleteProduct,
  removeImage,
};
