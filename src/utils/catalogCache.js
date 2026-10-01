import { getCache, setCache, clearCachePrefix } from "./memoryCache.js";
import config from "../config/index.js";

const PREFIX = "catalog:";

function stableQueryKey(query) {
  return Object.keys(query)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(String(query[k] ?? ""))}`)
    .join("&");
}

function catalogKey(storeId, type, key) {
  const sid = storeId ? String(storeId) : "default";
  return `${PREFIX}${sid}:${type}:${key}`;
}

function getCatalogCache(storeId, type, key) {
  return getCache(catalogKey(storeId, type, key));
}

function setCatalogCache(storeId, type, key, value) {
  setCache(catalogKey(storeId, type, key), value, config.cache.catalogTtlMs);
}

function clearCatalogCache() {
  clearCachePrefix(PREFIX);
}

export { stableQueryKey, getCatalogCache, setCatalogCache, clearCatalogCache };
