import express from "express";
const router = express.Router();

import authenticate from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { ROLES } from "../../constants/index.js";
import * as reportController from "./reports.controller.js";

router.use("/", authenticate, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MANAGER));

router.get("/sales", reportController.salesReport);
router.get("/inventory", reportController.inventoryReport);
router.get("/customers", reportController.customerReport);
router.get("/payments", reportController.paymentsReport);
router.get("/vendors", reportController.vendorReport);

export default router;
