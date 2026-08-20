import express from "express";
const router = express.Router();

import authenticate from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { ROLES } from "../../constants/index.js";
import * as pageController from "./pages.controller.js";
import { param } from "express-validator";
import validate from "../../middlewares/validate.js";

const mongoIdRule = [param("id").isMongoId().withMessage("Invalid page id."), validate];

/* ── Public ─────────────────────────────────────────────────── */
router.get("/slug/:slug", pageController.getPublicPage);

/* ── Admin ──────────────────────────────────────────────────── */
router.use("/", authenticate, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.EDITOR));
router.get("/", pageController.listAllPages);
router.get("/:id", mongoIdRule, pageController.getPageById);
router.post("/", pageController.createPage);
router.patch("/:id", mongoIdRule, pageController.updatePage);
router.delete("/:id", mongoIdRule, pageController.deletePage);

export default router;
