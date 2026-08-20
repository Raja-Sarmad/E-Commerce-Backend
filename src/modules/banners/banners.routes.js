import express from "express";
const router = express.Router();

import authenticate from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { uploadSingle } from "../../middlewares/multer.js";
import { ROLES } from "../../constants/index.js";
import * as bannerController from "./banners.controller.js";
import { param } from "express-validator";
import validate from "../../middlewares/validate.js";

const mongoIdRule = [param("id").isMongoId().withMessage("Invalid banner id."), validate];

/* ── Public ─────────────────────────────────────────────────── */
router.get("/", bannerController.listActiveBanners);
router.post("/:id/click", mongoIdRule, bannerController.trackBannerClick);

/* ── Admin ──────────────────────────────────────────────────── */
router.use("/admin", authenticate, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.EDITOR));
router.get("/admin/list", bannerController.listAllBanners);
router.get("/admin/:id", mongoIdRule, bannerController.getBannerById);
router.post("/admin", uploadSingle("image"), bannerController.createBanner);
router.patch("/admin/:id", mongoIdRule, uploadSingle("image"), bannerController.updateBanner);
router.delete("/admin/:id", mongoIdRule, bannerController.deleteBanner);

export default router;
