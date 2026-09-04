import express from "express";
const router = express.Router();

import authenticate from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { uploadSingle } from "../../middlewares/multer.js";
import { ROLES } from "../../constants/index.js";
import * as categoryController from "./categories.controller.js";
import { body, param } from "express-validator";
import validate from "../../middlewares/validate.js";
import cacheHeaders from "../../middlewares/cacheHeaders.js";

const mongoIdRule = [param("id").isMongoId().withMessage("Invalid category id."), validate];

const createRules = [
  body("name").trim().notEmpty().withMessage("Category name is required."),
  body("slug").optional().isString().isSlug().withMessage("Slug must be URL-friendly."),
  validate,
];

/* ── Public ─────────────────────────────────────────────────── */
router.get("/", cacheHeaders(120), categoryController.listCategories);
router.get("/all", cacheHeaders(120), categoryController.listAllCategories);
router.get("/slug/:slug", cacheHeaders(120), categoryController.getCategoryBySlug);
router.get("/:id", mongoIdRule, cacheHeaders(120), categoryController.getCategoryById);

/* ── Admin ──────────────────────────────────────────────────── */
router.use("/", authenticate, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MANAGER));
router.get("/admin/list", categoryController.listAdminCategories);
router.post("/", uploadSingle("image"), createRules, categoryController.createCategory);
router.patch("/:id", mongoIdRule, uploadSingle("image"), categoryController.updateCategory);
router.delete("/:id", mongoIdRule, categoryController.deleteCategory);

export default router;
