import express from "express";
const router = express.Router();

import authenticate from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { ROLES } from "../../constants/index.js";
import * as couponController from "./coupons.controller.js";
import { body, param } from "express-validator";
import validate from "../../middlewares/validate.js";

const mongoIdRule = [param("id").isMongoId().withMessage("Invalid coupon id."), validate];

const createRules = [
  body("code").trim().notEmpty().withMessage("Coupon code is required."),
  body("type").isIn(["percentage", "fixed"]).withMessage("Type must be percentage or fixed."),
  body("value").isNumeric().withMessage("Value is required.").custom((v) => v >= 0),
  body("minSpend").optional().isNumeric(),
  body("maxDiscount").optional().isNumeric(),
  body("maxUses").optional().isInt({ min: 1 }),
  body("expiresAt").optional().isISO8601().withMessage("expiresAt must be a valid date."),
  validate,
];

/* ── Public validate (authenticated for per-user limits) ────── */
router.post("/validate", authenticate, couponController.validateCoupon);

/* ── Admin ──────────────────────────────────────────────────── */
router.use("/", authenticate, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MANAGER));
router.get("/", couponController.listCoupons);
router.get("/:id", mongoIdRule, couponController.getCouponById);
router.post("/", createRules, couponController.createCoupon);
router.patch("/:id", mongoIdRule, couponController.updateCoupon);
router.delete("/:id", mongoIdRule, couponController.deleteCoupon);

export default router;
