/**
 * Build a Mongoose query helper from Express req.query:
 * - sort, page, limit, fields
 * - minPrice/maxPrice, search etc. handled per-module via filters
 *
 * Returns { page, limit, skip, sort, select } to pass into queries.
 */
function getPagination(query) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Build pagination meta block for responses.
 */
function getPaginationMeta({ page, limit, total, totalPages }) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(totalPages, 0),
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * Sanitize sort string: `name,-price` -> `{ name: 1, price: -1 }`.
 * Whitelist optional allowed fields to prevent injection.
 */
function getSort(query, allowed = []) {
  const raw = query.sort;
  if (!raw) return { createdAt: -1 };
  const out = {};
  raw.split(",").forEach((part) => {
    const desc = part.startsWith("-");
    const key = desc ? part.slice(1) : part;
    if (allowed.length > 0 && !allowed.includes(key)) return;
    out[key] = desc ? -1 : 1;
  });
  return Object.keys(out).length ? out : { createdAt: -1 };
}

export { getPagination, getPaginationMeta, getSort };
