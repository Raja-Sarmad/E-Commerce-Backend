import slugify from "slugify";

/**
 * Slugify a string for URLs. Falls back to a short random token
 * when the input produces an empty slug.
 */
function createSlug(value) {
  const base = slugify(String(value || ""), {
    lower: true,
    strict: true,
    trim: true,
  });
  return base || `item-${Date.now().toString(36)}`;
}

export { createSlug };
