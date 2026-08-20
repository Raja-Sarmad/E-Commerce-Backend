import Product from "./products.model.js";
import AppError from "../../utils/AppError.js";
import { createSlug } from "../../utils/slugify.js";
import { getPagination, getPaginationMeta, getSort } from "../../utils/pagination.js";
import { uploadMany, uploadUrls, deleteFromCloudinary } from "../../utils/cloudinary.js";
import { checkLowStock } from "../notifications/notifications.service.js";

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
  if (query.bestSeller === "true") filter.isBestSeller = true;
  if (query.trending === "true") filter.isTrending = true;
  if (query.onSale === "true") filter.onSale = true;
  if (query.inStock === "true") filter.stock = { $gt: 0 };
  if (query.colors) filter.colors = { $in: [query.colors] };

  return filter;
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
  if (query.stockStatus === "low") filter.stock = { $lte: query.threshold ? Number(query.threshold) : 10 };
  if (query.stockStatus === "out") filter.stock = { $lte: 0 };
  return filter;
}

async function listProducts(query, { admin = false } = {}) {
  const { page, limit, skip } = getPagination(query);
  const sort = getSort(query, [
    "position", "createdAt", "price", "name", "rating", "reviewsCount", "stock",
  ]);

  const filter = admin ? buildAdminFilter(query) : buildPublicFilter(query);

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);

  return {
    products,
    meta: getPaginationMeta({ page, limit, total, totalPages: Math.ceil(total / limit) }),
  };
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

  const urlResults = urlImages.length > 0 ? await uploadUrls(urlImages, "novamart/products") : [];

  let images = urlResults.map((u) => u.url);
  let publicIds = urlResults.filter((u) => u.publicId).map((u) => u.publicId);

  if (files && files.length) {
    const uploaded = await uploadMany(files, "novamart/products");
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
    if (cleanData[k] !== undefined && cleanData[k] !== "") cleanData[k] = Number(cleanData[k]);
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

  const product = await Product.create({ ...cleanData, slug, images, publicIds });

  await checkLowStock(product);
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

  const urlResults = newUrlImages.length > 0 ? await uploadUrls(newUrlImages, "novamart/products") : [];

  let newImages = urlResults.map((u) => u.url);
  const newPublicIds = urlResults.filter((u) => u.publicId).map((u) => u.publicId);

  if (files && files.length) {
    const uploaded = await uploadMany(files, "novamart/products");
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
    if (cleanData[k] !== undefined && cleanData[k] !== "") cleanData[k] = Number(cleanData[k]);
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

  const allowed = [
    "name", "slug", "brand", "brandRef", "category", "categoryRef", "categorySlug",
    "description", "features", "specifications", "price", "compareAtPrice",
    "stock", "lowStockThreshold", "sku", "tags", "isFeatured", "isBestSeller",
    "isNew", "isTrending", "colors", "sizes", "position", "isActive", "vendor",
  ];
  allowed.forEach((k) => {
    if (cleanData[k] !== undefined) product[k] = cleanData[k];
  });

  if (data.slug) product.slug = createSlug(data.slug);
  if (!product.slug) product.slug = createSlug(product.name);

  await product.save();
  await checkLowStock(product);
  return product;
}

async function deleteProduct(productId) {
  const product = await Product.findById(productId);
  if (!product) throw new AppError("Product not found.", 404);

  for (const publicId of product.publicIds || []) {
    await deleteFromCloudinary(publicId);
  }
  await product.deleteOne();
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
  return product;
}

export {
  listProducts,
  getProductById,
  getProductBySlug,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  removeImage,
};
