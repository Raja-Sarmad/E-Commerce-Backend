const ROLES = Object.freeze({
  CUSTOMER: "customer",
  VENDOR: "vendor",
  STAFF: "staff",
  MANAGER: "manager",
  EDITOR: "editor",
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin",
});

const ALL_ROLES = Object.values(ROLES);

const ORDER_STATUSES = Object.freeze([
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

const PAYMENT_STATUSES = Object.freeze([
  "pending",
  "succeeded",
  "failed",
  "refunded",
]);

const PAYMENT_METHODS = Object.freeze([
  "card",
  "paypal",
  "cod",
  "apple_pay",
  "google_pay",
]);

const BANNER_POSITIONS = Object.freeze([
  "hero",
  "promo",
  "homepage",
  "offer",
]);

const BLOG_STATUSES = Object.freeze(["published", "draft", "scheduled"]);

const MEDIA_TYPES = Object.freeze(["image", "video", "document"]);

const NOTIFICATION_TYPES = Object.freeze([
  "order",
  "review",
  "customer",
  "stock",
  "system",
]);

const LOG_TYPES = Object.freeze(["login", "activity", "error", "audit"]);

const DEFAULT_SETTINGS = Object.freeze({
  storeName: "NovaMart",
  storeEmail: "support@novamart.com",
  supportPhone: "+1 555 010 0000",
  currency: "USD",
  currencySymbol: "$",
  taxRate: 0,
  freeShippingThreshold: 100,
  defaultShippingRate: 12,
  lowStockThreshold: 10,
  maxOrderItems: 50,
});

export {
  ROLES,
  ALL_ROLES,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
  BANNER_POSITIONS,
  BLOG_STATUSES,
  MEDIA_TYPES,
  NOTIFICATION_TYPES,
  LOG_TYPES,
  DEFAULT_SETTINGS,
};
