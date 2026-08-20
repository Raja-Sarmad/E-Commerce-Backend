import express from "express";
const router = express.Router();

import authenticate from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { ROLES } from "../../constants/index.js";
import * as faqController from "./faqs.controller.js";
import { param } from "express-validator";
import validate from "../../middlewares/validate.js";

const mongoIdRule = [param("id").isMongoId().withMessage("Invalid FAQ id."), validate];

/* ── Public ─────────────────────────────────────────────────── */
router.get("/", faqController.listPublicFaqs);
router.get("/categories", faqController.listFaqCategories);

/* ── Admin ──────────────────────────────────────────────────── */
router.use("/admin", authenticate, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.EDITOR));
router.get("/admin/list", faqController.listAllFaqs);
router.get("/admin/:id", mongoIdRule, faqController.getFaqById);
router.post("/admin", faqController.createFaq);
router.patch("/admin/:id", mongoIdRule, faqController.updateFaq);
router.delete("/admin/:id", mongoIdRule, faqController.deleteFaq);

export default router;
