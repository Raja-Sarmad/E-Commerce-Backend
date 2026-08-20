import express from "express";
const router = express.Router({ mergeParams: true });

import authenticate from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { ROLES } from "../../constants/index.js";
import * as userController from "./users.controller.js";
import {
  mongoId,
  updateProfileRules,
  changePasswordRules,
  adminUpdateRules,
} from "./users.validation.js";

/* ── Own profile (any authenticated user) ───────────────────── */
router.get("/me", authenticate, userController.getProfile);
router.patch("/me", authenticate, updateProfileRules, userController.updateProfile);
router.patch("/me/password", authenticate, changePasswordRules, userController.updatePassword);

/* ── Admin user management ──────────────────────────────────── */
router.use(
  "/",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MANAGER)
);

router.get("/", userController.listUsers);
router.get("/:id", mongoId, userController.getUserById);
router.patch("/:id", mongoId, adminUpdateRules, userController.updateUserByAdmin);
router.delete("/:id", mongoId, userController.deleteUser);
router.patch("/:id/block", mongoId, userController.blockUser);
router.patch("/:id/unblock", mongoId, userController.unblockUser);

export default router;
