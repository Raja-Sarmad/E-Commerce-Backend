import express from "express";
const router = express.Router();

import authenticate from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { ROLES } from "../../constants/index.js";
import * as orderController from "./orders.controller.js";
import { body, param } from "express-validator";
import validate from "../../middlewares/validate.js";
import { ORDER_STATUSES } from "../../constants/index.js";

const mongoIdRule = [param("id").isMongoId().withMessage("Invalid order id."), validate];
const numberRule = [param("number").notEmpty().withMessage("Order number is required."), validate];

const createRules = [
  body("items").isArray({ min: 1 }).withMessage("Items are required."),
  body("shippingAddress").isObject().withMessage("Shipping address is required."),
  body("billingAddress").optional().isObject(),
  body("paymentMethod").notEmpty().withMessage("Payment method is required."),
  body("deliveryMethod").optional().isString(),
  body("couponCode").optional().isString(),
  validate,
];

const statusRule = [
  mongoIdRule,
  body("status").isIn(ORDER_STATUSES).withMessage(`Status must be one of: ${ORDER_STATUSES.join(", ")}.`),
  validate,
];

/* ── Customer ───────────────────────────────────────────────── */
router.post("/", authenticate, createRules, orderController.createOrder);
router.get("/my-orders", authenticate, orderController.listMyOrders);
router.get("/my-orders/:number", authenticate, numberRule, orderController.getMyOrderByNumber);
router.patch("/cancel/:id", authenticate, mongoIdRule, orderController.cancelOrder);

/* ── Admin ──────────────────────────────────────────────────── */
router.use("/admin", authenticate, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.STAFF));
router.get("/admin/list", orderController.listAllOrders);
router.get("/admin/number/:number", numberRule, orderController.getOrderByNumber);
router.patch("/admin/:id/status", statusRule, orderController.updateOrderStatus);
router.patch("/admin/:id/tracking", mongoIdRule, orderController.addTracking);

export default router;
