import { body, param } from "express-validator";
import validate from "../../middlewares/validate.js";

/**
 * Validate the variants field — accepts either an array of
 * { size, stock } objects or a JSON-encoded string (FormData variant).
 */
function isValidVariants(v) {
  let parsed = v;
  if (typeof v === "string") {
    try {
      parsed = JSON.parse(v);
    } catch {
      return false;
    }
  }
  if (!Array.isArray(parsed)) return false;
  return parsed.every((item) => {
    if (!item || typeof item !== "object") return false;
    if (typeof item.size !== "string" || !item.size.trim()) return false;
    if (item.stock !== undefined) {
      const n = Number(item.stock);
      if (isNaN(n) || n < 0) return false;
    }
    return true;
  });
}

const mongoId = param("id").isMongoId().withMessage("Invalid product id.");
const mongoIdRule = [mongoId, validate];

const createProductRules = [
  body("name").trim().notEmpty().withMessage("Product name is required.").isLength({ max: 200 }),
  body("price").custom((v) => {
    const n = Number(v);
    if (isNaN(n)) throw new Error("Price must be a number.");
    if (n <= 0) throw new Error("Price must be greater than 0.");
    return true;
  }),
  body("compareAtPrice").optional({ values: "falsy" }).custom((v) => {
    if (v === "" || v === undefined || v === null) return true;
    const n = Number(v);
    if (isNaN(n)) throw new Error("Compare-at price must be a number.");
    return true;
  }),
  body("category").optional().isString(),
  body("categorySlug").optional().isString(),
  body("brand").optional().isString(),
  body("description").optional().isString(),
  body("features").optional().custom((v) => {
    if (Array.isArray(v)) return true;
    if (typeof v === "string") return true;
    return false;
  }),
  body("stock").optional().custom((v) => {
    const n = Number(v);
    if (isNaN(n) || n < 0) throw new Error("Stock must be 0 or greater.");
    return true;
  }),
  body("sku").optional().isString(),
  body("tags").optional().custom((v) => {
    if (Array.isArray(v)) return true;
    if (typeof v === "string") return true;
    return false;
  }),
  body("colors").optional().custom((v) => {
    if (Array.isArray(v)) return true;
    if (typeof v === "string") return true;
    return false;
  }),
  body("sizes").optional().custom((v) => {
    if (Array.isArray(v)) return true;
    if (typeof v === "string") return true;
    return false;
  }),
  body("variants").optional().custom((v) => {
    if (isValidVariants(v)) return true;
    throw new Error("Variants must be an array of { size, stock }.");
  }),
  body("isFeatured").optional().custom((v) => {
    if (v === "true" || v === "false" || typeof v === "boolean") return true;
    return false;
  }),
  body("isBestSeller").optional().custom((v) => {
    if (v === "true" || v === "false" || typeof v === "boolean") return true;
    return false;
  }),
  body("isNew").optional().custom((v) => {
    if (v === "true" || v === "false" || typeof v === "boolean") return true;
    return false;
  }),
  body("isTrending").optional().custom((v) => {
    if (v === "true" || v === "false" || typeof v === "boolean") return true;
    return false;
  }),
  body("isActive").optional().custom((v) => {
    if (v === "true" || v === "false" || typeof v === "boolean") return true;
    return false;
  }),
  body("position").optional().custom((v) => {
    const n = Number(v);
    if (isNaN(n)) throw new Error("Position must be a number.");
    return true;
  }),
  validate,
];

const updateProductRules = [
  mongoId,
  body("name").optional().trim().isLength({ max: 200 }),
  body("price").optional().custom((v) => {
    const n = Number(v);
    if (isNaN(n)) throw new Error("Price must be a number.");
    if (n <= 0) throw new Error("Price must be greater than 0.");
    return true;
  }),
  body("images").optional().custom((v) => {
    if (Array.isArray(v)) return true;
    if (typeof v === "string") return true;
    return false;
  }),
  body("tags").optional().custom((v) => {
    if (Array.isArray(v)) return true;
    if (typeof v === "string") return true;
    return false;
  }),
  body("colors").optional().custom((v) => {
    if (Array.isArray(v)) return true;
    if (typeof v === "string") return true;
    return false;
  }),
  body("sizes").optional().custom((v) => {
    if (Array.isArray(v)) return true;
    if (typeof v === "string") return true;
    return false;
  }),
  body("variants").optional().custom((v) => {
    if (isValidVariants(v)) return true;
    throw new Error("Variants must be an array of { size, stock }.");
  }),
  body("features").optional().custom((v) => {
    if (Array.isArray(v)) return true;
    if (typeof v === "string") return true;
    return false;
  }),
  validate,
];

export { mongoIdRule, createProductRules, updateProductRules };
