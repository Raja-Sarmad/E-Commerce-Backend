import express from "express";
const router = express.Router();

import authenticate from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { ROLES } from "../../constants/index.js";
import * as paymentController from "./payments.controller.js";
import { param } from "express-validator";
import validate from "../../middlewares/validate.js";

const mongoIdRule = [param("id").isMongoId().withMessage("Invalid id."), validate];

/* ── Public ─────────────────────────────────────────────────── */
router.get("/methods", paymentController.listPaymentMethods);

/* ── Admin ──────────────────────────────────────────────────── */
router.use("/", authenticate, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN));
router.get("/admin/methods", paymentController.listAllPaymentMethods);
router.patch("/admin/methods/:id", mongoIdRule, paymentController.updatePaymentMethod);

router.get("/admin/transactions", paymentController.listTransactions);
router.patch(
  "/admin/transactions/:id/status",
  mongoIdRule,
  paymentController.updateTransactionStatus
);

export default router;
