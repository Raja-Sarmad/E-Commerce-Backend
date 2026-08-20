import express from "express";
const router = express.Router();

import authenticate from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { ROLES } from "../../constants/index.js";
import * as messageController from "./messages.controller.js";
import { body, param } from "express-validator";
import validate from "../../middlewares/validate.js";

const mongoIdRule = [param("id").isMongoId().withMessage("Invalid message id."), validate];

/* ── Public contact form ────────────────────────────────────── */
router.post(
  "/contact",
  body("name").notEmpty().withMessage("Name is required."),
  body("email").isEmail().withMessage("A valid email is required."),
  body("subject").notEmpty().withMessage("Subject is required."),
  body("message").isLength({ min: 10 }).withMessage("Message must be at least 10 characters."),
  validate,
  messageController.createMessage
);

/* ── Admin ──────────────────────────────────────────────────── */
router.use("/admin", authenticate, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.STAFF));
router.get("/admin/list", messageController.listMessages);
router.get("/admin/:id", mongoIdRule, messageController.getMessage);
router.patch("/admin/:id", mongoIdRule, messageController.updateMessage);
router.delete("/admin/:id", mongoIdRule, messageController.deleteMessage);

export default router;
