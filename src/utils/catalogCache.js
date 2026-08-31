import { getCache, setCache, clearCachePrefix } from "./memoryCache.js";
import config from "../config/index.js";

const PREFIX = "catalog:";

function stableQueryKey(query) {
  return Object.keys(query)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(String(query[k] ?? ""))}`)
    .join("&");
}

function getCatalogCache(type, key) {
  return getCache(`${PREFIX}${type}:${key}`);
}

function setCatalogCache(type, key, value) {
  setCache(`${PREFIX}${type}:${key}`, value, config.cache.catalogTtlMs);
}

function clearCatalogCache() {
  clearCachePrefix(PREFIX);
}

export { stableQueryKey, getCatalogCache, setCatalogCache, clearCatalogCache };
