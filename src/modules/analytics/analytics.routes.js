import express from "express";
const router = express.Router();

import authenticate from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { ROLES } from "../../constants/index.js";
import * as analyticsController from "./analytics.controller.js";

router.use("/", authenticate, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MANAGER));

router.get("/overview", analyticsController.getOverview);
router.get("/revenue-series", analyticsController.getRevenueSeries);
router.get("/sales-by-category", analyticsController.getSalesByCategory);
router.get("/daily-orders", analyticsController.getDailyOrders);
router.get("/top-products", analyticsController.getTopProducts);
router.get("/low-stock", analyticsController.getLowStockProducts);
router.get("/recent-orders", analyticsController.getRecentOrders);
router.get("/recent-reviews", analyticsController.getRecentReviews);
router.get("/recent-notifications", analyticsController.getRecentNotifications);
router.get("/recent-activity", analyticsController.getRecentActivity);
router.get("/revenue-comparison", analyticsController.getRevenueComparison);

export default router;
