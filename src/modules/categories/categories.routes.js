import express from "express";
const router = express.Router();

import authenticate from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { uploadSingle } from "../../middlewares/multer.js";
import { ROLES } from "../../constants/index.js";
import * as categoryController from "./categories.controller.js";
import { body, param } from "express-validator";
import validate from "../../middlewares/validate.js";

const mongoIdRule = [param("id").isMongoId().withMessage("Invalid category id."), validate];

const createRules = [
  body("name").trim().notEmpty().withMessage("Category name is required."),
  body("slug").optional().isString().isSlug().withMessage("Slug must be URL-friendly."),
  validate,
];

/* ── Public ─────────────────────────────────────────────────── */
router.get("/", categoryController.listCategories);
router.get("/all", categoryController.listAllCategories);
router.get("/slug/:slug", categoryController.getCategoryBySlug);
router.get("/:id", mongoIdRule, categoryController.getCategoryById);

/* ── Admin ──────────────────────────────────────────────────── */
router.use("/", authenticate, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MANAGER));
router.post("/", uploadSingle("image"), createRules, categoryController.createCategory);
router.patch("/:id", mongoIdRule, uploadSingle("image"), categoryController.updateCategory);
router.delete("/:id", mongoIdRule, categoryController.deleteCategory);

export default router;
