import express from "express";
const router = express.Router();

import authenticate from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { ROLES } from "../../constants/index.js";
import * as settingsController from "./settings.controller.js";

/* ── Public (safe subset) ───────────────────────────────────── */
router.get("/", settingsController.getSettings);

/* ── Admin ──────────────────────────────────────────────────── */
router.use("/", authenticate, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN));
router.patch("/", settingsController.updateSettings);
router.patch("/email-templates/:name", settingsController.updateEmailTemplate);

export default router;
