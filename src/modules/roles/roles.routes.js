import express from "express";
const router = express.Router();

import authenticate from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { ROLES } from "../../constants/index.js";
import * as roleController from "./roles.controller.js";
import { param } from "express-validator";
import validate from "../../middlewares/validate.js";

const mongoIdRule = [param("id").isMongoId().withMessage("Invalid role id."), validate];

router.use("/", authenticate, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN));
router.get("/", roleController.listRoles);
router.get("/:id", mongoIdRule, roleController.getRoleById);
router.post("/", roleController.createRole);
router.patch("/:id", mongoIdRule, roleController.updateRole);
router.delete("/:id", mongoIdRule, roleController.deleteRole);

export default router;
