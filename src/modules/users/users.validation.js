import { body, param } from "express-validator";
import validate from "../../middlewares/validate.js";
import { ALL_ROLES } from "../../constants/index.js";

const mongoId = () => param("id").isMongoId().withMessage("Invalid user id.");

const updateProfileRules = [
  body("name").optional().isLength({ min: 2, max: 80 }).withMessage("Name must be 2-80 characters."),
  body("phone").optional().isString().trim().escape(),
  body("avatar").optional().isURL().withMessage("Avatar must be a valid URL."),
  body("address.firstName").optional().isString().trim().escape(),
  body("address.lastName").optional().isString().trim().escape(),
  body("address.address").optional().isString().trim().escape(),
  body("address.city").optional().isString().trim().escape(),
  body("address.state").optional().isString().trim().escape(),
  body("address.zip").optional().isString().trim().escape(),
  body("address.country").optional().isString().trim().escape(),
  body("address.phone").optional().isString().trim().escape(),
  validate,
];

const changePasswordRules = [
  body("currentPassword").notEmpty().withMessage("Current password is required."),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters."),
  validate,
];

const adminUpdateRules = [
  body("name").optional().isLength({ min: 2, max: 80 }),
  body("email").optional().isEmail().withMessage("Valid email required."),
  body("role")
    .optional()
    .isIn(ALL_ROLES)
    .withMessage(`Role must be one of: ${ALL_ROLES.join(", ")}.`),
  body("tier").optional().isIn(["Bronze", "Silver", "Gold", "Platinum"]),
  body("isBlocked").optional().isBoolean(),
  body("isEmailVerified").optional().isBoolean(),
  body("loyaltyPoints").optional().isInt({ min: 0 }),
  validate,
];

const listQueryRules = [
  body("search").optional(),
];

export { mongoId, updateProfileRules, changePasswordRules, adminUpdateRules, listQueryRules };
