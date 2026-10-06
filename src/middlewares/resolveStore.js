import mongoose from "mongoose";
import Store from "../modules/stores/stores.model.js";
import AppError from "../utils/AppError.js";

const DEFAULT_SLUG = "ecommerce";
const slugCache = new Map();

const DEFAULT_STORES = [
  { slug: "ecommerce", name: "NovaMart" },
  { slug: "store", name: "Overdose Store" },
];

async function ensureDefaultStores() {
  for (const s of DEFAULT_STORES) {
    await Store.findOneAndUpdate({ slug: s.slug }, s, { upsert: true, new: true });
  }
}

async function loadStore(slug) {
  const key = slug.toLowerCase();
  if (slugCache.has(key)) return slugCache.get(key);
  let store = await Store.findOne({ slug: key, isActive: true }).lean();
  if (!store) {
    await ensureDefaultStores();
    store = await Store.findOne({ slug: key, isActive: true }).lean();
  }
  if (store) slugCache.set(key, store);
  return store;
}

/** Attach req.store from X-Store-Slug header (defaults to ecommerce). */
export default async function resolveStore(req, _res, next) {
  try {
    if (mongoose.connection.readyState !== 1) {
      return next(
        new AppError(
          "Database is not connected. Start MongoDB locally or whitelist your IP in MongoDB Atlas.",
          503
        )
      );
    }

    const raw =
      req.headers["x-store-slug"] ||
      req.query.store ||
      DEFAULT_SLUG;
    const slug = String(raw).trim().toLowerCase();
    const store = await loadStore(slug);
    if (!store) {
      return next(new AppError(`Store "${slug}" not found.`, 400));
    }
    req.store = store;
    next();
  } catch (err) {
    next(err);
  }
}

export function clearStoreCache() {
  slugCache.clear();
}
