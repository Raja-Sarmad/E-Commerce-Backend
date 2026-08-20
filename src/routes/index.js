import express from "express";
const router = express.Router();

import authRoutes from "../modules/auth/auth.routes.js";
import userRoutes from "../modules/users/users.routes.js";
import productRoutes from "../modules/products/products.routes.js";
import categoryRoutes from "../modules/categories/categories.routes.js";
import brandRoutes from "../modules/brands/brands.routes.js";
import reviewRoutes from "../modules/reviews/reviews.routes.js";
import orderRoutes from "../modules/orders/orders.routes.js";
import couponRoutes from "../modules/coupons/coupons.routes.js";
import shippingRoutes from "../modules/shipping/shipping.routes.js";
import paymentRoutes from "../modules/payments/payments.routes.js";
import vendorRoutes from "../modules/vendors/vendors.routes.js";
import inventoryRoutes from "../modules/inventory/inventory.routes.js";
import wishlistRoutes from "../modules/wishlist/wishlist.routes.js";
import blogRoutes from "../modules/blog/blog.routes.js";
import bannerRoutes from "../modules/banners/banners.routes.js";
import pageRoutes from "../modules/pages/pages.routes.js";
import faqRoutes from "../modules/faqs/faqs.routes.js";
import newsletterRoutes from "../modules/newsletter/newsletter.routes.js";
import messageRoutes from "../modules/messages/messages.routes.js";
import notificationRoutes from "../modules/notifications/notifications.routes.js";
import analyticsRoutes from "../modules/analytics/analytics.routes.js";
import reportRoutes from "../modules/reports/reports.routes.js";
import roleRoutes from "../modules/roles/roles.routes.js";
import mediaRoutes from "../modules/media/media.routes.js";
import settingsRoutes from "../modules/settings/settings.routes.js";
import logRoutes from "../modules/logs/logs.routes.js";

/* ── Health ─────────────────────────────────────────────────── */
router.get("/health", (_req, res) =>
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: "NovaMart API is healthy.",
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    },
  })
);

/* ── Feature modules ────────────────────────────────────────── */
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/brands", brandRoutes);
router.use("/reviews", reviewRoutes);
router.use("/orders", orderRoutes);
router.use("/coupons", couponRoutes);
router.use("/shipping", shippingRoutes);
router.use("/payments", paymentRoutes);
router.use("/vendors", vendorRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/blog", blogRoutes);
router.use("/banners", bannerRoutes);
router.use("/pages", pageRoutes);
router.use("/faqs", faqRoutes);
router.use("/newsletter", newsletterRoutes);
router.use("/messages", messageRoutes);
router.use("/notifications", notificationRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/reports", reportRoutes);
router.use("/roles", roleRoutes);
router.use("/media", mediaRoutes);
router.use("/settings", settingsRoutes);
router.use("/logs", logRoutes);

export default router;
