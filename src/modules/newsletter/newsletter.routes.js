import express from "express";
const router = express.Router();

import authenticate from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { ROLES } from "../../constants/index.js";
import * as newsletterController from "./newsletter.controller.js";
import { body, param } from "express-validator";
import validate from "../../middlewares/validate.js";

const emailRule = body("email").isEmail().withMessage("A valid email is required.").normalizeEmail();

/* ── Public ─────────────────────────────────────────────────── */
router.post("/subscribe", emailRule, validate, newsletterController.subscribe);
router.get("/unsubscribe/:email", newsletterController.unsubscribe);

/* ── Admin ──────────────────────────────────────────────────── */
router.use("/", authenticate, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN));
router.get("/", newsletterController.listSubscribers);
router.get("/:id", param("id").isMongoId(), validate, newsletterController.getSubscriber);
router.delete("/:id", param("id").isMongoId(), validate, newsletterController.deleteSubscriber);

export default router;
