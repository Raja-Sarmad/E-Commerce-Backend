import express from "express";
const router = express.Router();

import authenticate from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { ROLES } from "../../constants/index.js";
import * as reviewController from "./reviews.controller.js";
import { body, param } from "express-validator";
import validate from "../../middlewares/validate.js";

const productIdRule = [param("productId").isMongoId().withMessage("Invalid product id."), validate];
const mongoIdRule = [param("id").isMongoId().withMessage("Invalid review id."), validate];

const createRules = [
  body("productId").isMongoId().withMessage("Invalid product id."),
  body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be 1-5."),
  body("title").optional().isLength({ max: 120 }),
  body("body").isLength({ min: 3, max: 2000 }).withMessage("Review must be 3-2000 characters."),
  validate,
];

const updateRules = [
  body("rating").optional().isInt({ min: 1, max: 5 }),
  body("title").optional().isLength({ max: 120 }),
  body("body").optional().isLength({ min: 3, max: 2000 }),
  validate,
];

/* ── Public ─────────────────────────────────────────────────── */
router.get("/product/:productId", productIdRule, reviewController.listProductReviews);

/* ── Authenticated ──────────────────────────────────────────── */
router.post("/", authenticate, createRules, reviewController.createReview);
router.patch("/:id/helpful", authenticate, mongoIdRule, reviewController.toggleHelpful);
router.patch("/:id", authenticate, mongoIdRule, updateRules, reviewController.updateReview);
router.delete("/:id", authenticate, mongoIdRule, reviewController.deleteReview);

/* ── Admin ──────────────────────────────────────────────────── */
router.use("/admin", authenticate, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MANAGER));
router.get("/admin/list", reviewController.listAllReviews);
router.patch("/admin/:id/moderate", mongoIdRule, reviewController.moderateReview);

export default router;
