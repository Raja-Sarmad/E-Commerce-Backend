import { validationResult } from "express-validator";
import AppError from "../utils/AppError.js";

/**
 * validate — runs express-validator rules attached to the route and,
 * if any fail, throws a 400 AppError listing every invalid field.
 * Always pass this AFTER the validation chain.
 *
 * Usage:
 *   router.post("/", [
 *     body("name").notEmpty().isLength({ min: 2 }),
 *     validate,
 *   ], handler)
 */
const validate = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));
    return next(new AppError("Validation failed.", 400, details));
  }
  return next();
};

export default validate;
