import express from "express";
const router = express.Router();

import authenticate from "../../middlewares/authenticate.js";
import { authLimiter, passwordResetLimiter } from "../../middlewares/rateLimiter.js";
import * as authController from "./auth.controller.js";
import {
  registerRules,
  loginRules,
  refreshRules,
  emailOnlyRules,
  resetPasswordRules,
  verifyRules,
} from "./auth.validation.js";

/* ── Public ─────────────────────────────────────────────────── */
router.post("/register", authLimiter, registerRules, authController.register);
router.post("/login", authLimiter, loginRules, authController.login);
router.post("/refresh-token", refreshRules, authController.refresh);

router.get("/verify-email/:token", verifyRules, authController.verifyEmail);
router.post("/resend-verification", authLimiter, emailOnlyRules, authController.resendVerification);

router.post(
  "/forgot-password",
  passwordResetLimiter,
  emailOnlyRules,
  authController.forgotPassword
);
router.post(
  "/reset-password/:token",
  passwordResetLimiter,
  resetPasswordRules,
  authController.resetPassword
);

/* ── Authenticated ──────────────────────────────────────────── */
router.post("/logout", authenticate, authController.logout);

export default router;
