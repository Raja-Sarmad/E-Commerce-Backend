import express from "express";
const router = express.Router();

import authenticate from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { ROLES } from "../../constants/index.js";
import * as inventoryController from "./inventory.controller.js";
import { body, param } from "express-validator";
import validate from "../../middlewares/validate.js";

router.use("/", authenticate, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MANAGER));

router.get("/low-stock", inventoryController.listLowStock);
router.get("/history", inventoryController.listHistory);
router.post(
  "/adjust/:productId",
  param("productId").isMongoId().withMessage("Invalid product id."),
  body("adjustment").isInt().withMessage("Adjustment must be an integer."),
  validate,
  inventoryController.adjustStock
);

export default router;
