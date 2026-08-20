import express from "express";
const router = express.Router();

import authenticate from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { ROLES } from "../../constants/index.js";
import * as notificationController from "./notifications.controller.js";
import { param } from "express-validator";
import validate from "../../middlewares/validate.js";

const idRule = [param("id").isMongoId().withMessage("Invalid notification id."), validate];

/* ── My notifications (authenticated user) ──────────────────── */
router.get("/me", authenticate, notificationController.listMyNotifications);
router.patch("/me/read-all", authenticate, notificationController.markAllAsRead);

/* ── Admin notifications ────────────────────────────────────── */
router.use("/", authenticate, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN));
router.get("/", notificationController.listAdminNotifications);
router.patch("/:id/read", idRule, notificationController.markAsRead);
router.delete("/:id", idRule, notificationController.deleteNotification);

export default router;
