import express from "express";
const router = express.Router();

import authenticate from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { uploadSingle } from "../../middlewares/multer.js";
import { ROLES } from "../../constants/index.js";
import * as blogController from "./blog.controller.js";
import { body, param } from "express-validator";
import validate from "../../middlewares/validate.js";

const mongoIdRule = [param("id").isMongoId().withMessage("Invalid post id."), validate];

/* ── Public ─────────────────────────────────────────────────── */
router.get("/", blogController.listPublicPosts);
router.get("/slug/:slug", blogController.getPublicPost);

/* ── Admin ──────────────────────────────────────────────────── */
router.use("/admin", authenticate, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.EDITOR));
router.get("/admin/list", blogController.listAllPosts);
router.get("/admin/:id", mongoIdRule, blogController.getPostById);
router.post("/admin", uploadSingle("coverImage"), body("title").notEmpty().withMessage("Title is required."), validate, blogController.createPost);
router.patch("/admin/:id", mongoIdRule, uploadSingle("coverImage"), blogController.updatePost);
router.delete("/admin/:id", mongoIdRule, blogController.deletePost);

export default router;
