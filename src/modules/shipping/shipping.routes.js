import express from "express";
const router = express.Router();

import authenticate from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { ROLES } from "../../constants/index.js";
import * as shippingController from "./shipping.controller.js";
import { body, param } from "express-validator";
import validate from "../../middlewares/validate.js";

const mongoId = (name) => param(name).isMongoId().withMessage(`Invalid ${name}.`);

/* ── Public ─────────────────────────────────────────────────── */
router.get("/zones", shippingController.listZones);
router.get("/methods", shippingController.listMethods);

/* ── Admin ──────────────────────────────────────────────────── */
router.use("/", authenticate, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MANAGER));

router.get("/admin/zones", shippingController.listZones);
router.get("/admin/zones/:id", mongoId("id"), shippingController.getZone);
router.post("/admin/zones", body("name").notEmpty().withMessage("Zone name required."), validate, shippingController.createZone);
router.patch("/admin/zones/:id", mongoId("id"), shippingController.updateZone);
router.delete("/admin/zones/:id", mongoId("id"), shippingController.deleteZone);

router.get("/admin/methods", shippingController.listMethods);
router.get("/admin/methods/:id", mongoId("id"), shippingController.getMethod);
router.post("/admin/methods", body("name").notEmpty().withMessage("Method name required."), validate, shippingController.createMethod);
router.patch("/admin/methods/:id", mongoId("id"), shippingController.updateMethod);
router.delete("/admin/methods/:id", mongoId("id"), shippingController.deleteMethod);

export default router;
