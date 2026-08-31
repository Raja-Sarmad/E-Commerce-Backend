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

/* ── Public ─────────────────────────────────────────────────── */
router.get("/", cacheHeaders(120), brandController.listBrands);
router.get("/all", cacheHeaders(120), brandController.listAllBrands);
router.get("/:id", mongoIdRule, cacheHeaders(120), brandController.getBrandById);

/* ── Admin ──────────────────────────────────────────────────── */
router.use("/", authenticate, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MANAGER));
router.post("/", uploadSingle("logo"), createRules, brandController.createBrand);
router.patch("/:id", mongoIdRule, uploadSingle("logo"), brandController.updateBrand);
router.delete("/:id", mongoIdRule, brandController.deleteBrand);

export default router;
