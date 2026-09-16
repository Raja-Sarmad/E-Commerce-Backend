import express from "express";
const router = express.Router();

import authenticate from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { ROLES } from "../../constants/index.js";
import * as reelController from "./reels.controller.js";
import { body, param } from "express-validator";
import validate from "../../middlewares/validate.js";

const mongoIdRule = [param("id").isMongoId().withMessage("Invalid reel id."), validate];

const reelBodyRules = [
  body("title").trim().notEmpty().withMessage("Title is required."),
  body("video").trim().notEmpty().withMessage("Video URL is required."),
  body("slot").isInt({ min: 0, max: 4 }).withMessage("Slot must be between 0 and 4."),
  body("poster").optional().isString(),
  body("link").optional().isString(),
  body("active").optional().isBoolean(),
  validate,
];

router.get("/", reelController.listActiveReels);

router.use(
  "/admin",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.EDITOR, ROLES.MANAGER)
);
router.get("/admin/list", reelController.listAllReels);
router.get("/admin/:id", mongoIdRule, reelController.getReelById);
router.post("/admin", reelBodyRules, reelController.createReel);
router.patch("/admin/:id", mongoIdRule, reelController.updateReel);
router.delete("/admin/:id", mongoIdRule, reelController.deleteReel);

export default router;
