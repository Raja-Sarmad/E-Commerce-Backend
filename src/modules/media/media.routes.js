import express from "express";
const router = express.Router();

import authenticate from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { uploadMedia } from "../../middlewares/multer.js";
import { ROLES } from "../../constants/index.js";
import * as mediaController from "./media.controller.js";
import { param } from "express-validator";
import validate from "../../middlewares/validate.js";

const mongoIdRule = [param("id").isMongoId().withMessage("Invalid media id."), validate];

router.use("/", authenticate, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.EDITOR));
router.get("/", mediaController.listFiles);
router.post("/upload", uploadMedia, mediaController.uploadFile);
router.get("/:id", mongoIdRule, mediaController.getFile);
router.delete("/:id", mongoIdRule, mediaController.deleteFile);

export default router;
