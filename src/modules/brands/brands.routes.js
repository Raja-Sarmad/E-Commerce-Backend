import express from "express";
const router = express.Router();

import authenticate from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { uploadSingle } from "../../middlewares/multer.js";
import { ROLES } from "../../constants/index.js";
import * as brandController from "./brands.controller.js";
import { body, param } from "express-validator";
import validate from "../../middlewares/validate.js";
import cacheHeaders from "../../middlewares/cacheHeaders.js";

const mongoIdRule = [param("id").isMongoId().withMessage("Invalid brand id."), validate];
const createRules = [
  body("name").trim().notEmpty().withMessage("Brand name is required."),
  validate,
];

const adminOnly = [authenticate, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MANAGER)];

/* ── Public ─────────────────────────────────────────────────── */
router.get("/", cacheHeaders(120), brandController.listBrands);
router.get("/all", cacheHeaders(120), brandController.listAllBrands);

/* Admin list must be registered before /:id or "admin" is captured as an id. */
router.get("/admin/list", ...adminOnly, brandController.listAdminBrands);

router.get("/:id", mongoIdRule, cacheHeaders(120), brandController.getBrandById);

/* ── Admin write ────────────────────────────────────────────── */
router.post("/", ...adminOnly, uploadSingle("logo"), createRules, brandController.createBrand);
router.patch("/:id", ...adminOnly, mongoIdRule, uploadSingle("logo"), brandController.updateBrand);
router.delete("/:id", ...adminOnly, mongoIdRule, brandController.deleteBrand);

export default router;
