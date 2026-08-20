import express from "express";
const router = express.Router();

import authenticate from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { uploadSingle } from "../../middlewares/multer.js";
import { ROLES } from "../../constants/index.js";
import * as vendorController from "./vendors.controller.js";
import { body, param } from "express-validator";
import validate from "../../middlewares/validate.js";

const mongoIdRule = [param("id").isMongoId().withMessage("Invalid vendor id."), validate];

/* ── Vendor application (authenticated) ─────────────────────── */
router.post("/", authenticate, uploadSingle("logo"), vendorController.createVendor);

/* ── Admin ──────────────────────────────────────────────────── */
router.use("/", authenticate, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MANAGER));
router.get("/", vendorController.listVendors);
router.get("/:id", mongoIdRule, vendorController.getVendorById);
router.patch("/:id", mongoIdRule, uploadSingle("logo"), vendorController.updateVendor);
router.patch("/:id/status", mongoIdRule, body("status").isIn(["active", "pending", "suspended"]), validate, vendorController.setVendorStatus);
router.delete("/:id", mongoIdRule, vendorController.deleteVendor);

export default router;
