import express from "express";
const router = express.Router();

import authenticate from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { uploadMultiple } from "../../middlewares/multer.js";
import { ROLES } from "../../constants/index.js";
import * as productController from "./products.controller.js";
import {
  mongoIdRule,
  createProductRules,
  updateProductRules,
} from "./products.validation.js";

/* ── Public ─────────────────────────────────────────────────── */
router.get("/", productController.listProducts);
router.get("/slug/:slug", productController.getProductBySlug);
router.get("/:id", mongoIdRule, productController.getProduct);

/* ── Admin ──────────────────────────────────────────────────── */
router.use(
  "/admin",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.VENDOR)
);

router.get("/admin/list", productController.listAdminProducts);
router.get("/admin/:id", mongoIdRule, productController.getAdminProduct);
router.post(
  "/admin",
  uploadMultiple("images", 8),
  createProductRules,
  productController.createProduct
);
router.patch(
  "/admin/:id",
  mongoIdRule,
  uploadMultiple("images", 8),
  updateProductRules,
  productController.updateProduct
);
router.delete("/admin/:id", mongoIdRule, productController.deleteProduct);
router.delete(
  "/admin/:id/image",
  mongoIdRule,
  productController.removeImage
);

export default router;
