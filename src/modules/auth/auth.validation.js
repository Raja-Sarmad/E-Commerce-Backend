import { body, param } from "express-validator";
import validate from "../../middlewares/validate.js";

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
  body("phone").optional().isString().trim(),
  validate,
];

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
  loginRules,
  refreshRules,
  emailOnlyRules,
  resetPasswordRules,
  verifyRules,
};
