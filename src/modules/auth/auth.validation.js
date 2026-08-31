import { body, param } from "express-validator";
import validate from "../../middlewares/validate.js";

const phone = body("phone")
  .trim()
  .notEmpty()
  .withMessage("Phone number is required.")
  .isLength({ min: 10, max: 20 })
  .withMessage("Please enter a valid phone number.");

const otp = body("otp")
  .trim()
  .notEmpty()
  .withMessage("OTP is required.")
  .matches(/^\d{6}$/)
  .withMessage("OTP must be a 6-digit code.");

const password = body("password")
  .isLength({ min: 8 })
  .withMessage("Password must be at least 8 characters.")
  .matches(/[A-Z]/)
  .withMessage("Password must contain at least one uppercase letter.")
  .matches(/[0-9]/)
  .withMessage("Password must contain at least one number.");

const email = body("email").isEmail().withMessage("A valid email is required.").normalizeEmail();

const registerRules = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Name must be 2-80 characters."),
  email,
  password,
  phone,
  otp,
  validate,
];

const phoneOtpRules = [phone, validate];

const loginRules = [
  email,
  body("password").notEmpty().withMessage("Password is required."),
  validate,
];

const refreshRules = [
  body("refreshToken").optional().isString(),
  validate,
];

const emailOnlyRules = [email, validate];

const resetPasswordRules = [
  param("token").notEmpty().withMessage("Reset token is required."),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters."),
  validate,
];

const verifyRules = [
  param("token").notEmpty().withMessage("Verification token is required."),
  validate,
];

export {
  registerRules,
  phoneOtpRules,
  loginRules,
  refreshRules,
  emailOnlyRules,
  resetPasswordRules,
  verifyRules,
};
