import Order from "../orders/orders.model.js";
import User from "../users/users.model.js";
import Product from "../products/products.model.js";
import Review from "../reviews/reviews.model.js";
import Vendor from "../vendors/vendors.model.js";
import Notification from "../notifications/notifications.model.js";
import LogEntry from "../logs/logs.model.js";

async function getOverview() {
  const [revenueAgg, ordersCount, customersCount, productsCount, lowStockCount, outOfStockCount, pendingVendors, reviewsCount, aovAgg] =
    await Promise.all([
      Order.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        { $group: { _id: null, total: { $sum: "$total" }, avg: { $avg: "$total" } } },
      ]),
      Order.countDocuments(),
      User.countDocuments({ role: "customer" }),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ stock: { $gt: 0, $lte: 10 } }),
      Product.countDocuments({ stock: 0 }),
      Vendor.countDocuments({ status: "pending" }),
      Review.countDocuments({ status: "approved" }),
      Order.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        { $group: { _id: null, avg: { $avg: "$total" } } },
      ]),
    ]);

  return {
    revenue: Math.round((revenueAgg[0]?.total || 0) * 100) / 100,
    averageOrderValue: Math.round((aovAgg[0]?.avg || 0) * 100) / 100,
    orders: ordersCount,
    customers: customersCount,
    products: productsCount,
    lowStock: lowStockCount,
    outOfStock: outOfStockCount,
    pendingVendors: pendingVendors,
    reviews: reviewsCount,
  };
}

async function getRevenueSeries(months = 8) {
  const start = new Date();
  start.setMonth(start.getMonth() - (months - 1), 1);
  start.setHours(0, 0, 0, 0);

  const rows = await Order.aggregate([
    { $match: { status: { $ne: "cancelled" }, createdAt: { $gte: start } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        value: { $sum: "$total" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const map = Object.fromEntries(rows.map((r) => [r._id, r.value]));
  const out = [];
  for (let i = 0; i < months; i += 1) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const key = d.toISOString().slice(0, 7);
    const label = d.toLocaleString("en", { month: "short" });
    out.push({ label, key, value: Math.round((map[key] || 0) * 100) / 100 });
  }
  return out;
}

async function getSalesByCategory() {
  const rows = await Order.aggregate([
    { $match: { status: { $ne: "cancelled" } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.name",
        value: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        orders: { $sum: "$items.quantity" },
      },
    },
    { $sort: { value: -1 } },
    { $limit: 10 },
  ]);
  return rows.map((r) => ({ name: r._id, value: Math.round(r.value * 100) / 100, orders: r.orders }));
}

async function getDailyOrders(days = 7) {
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  const rows = await Order.aggregate([
    { $match: { createdAt: { $gte: start } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
  ]);

  const map = Object.fromEntries(rows.map((r) => [r._id, r.count]));
  const out = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    out.push({
      label: d.toLocaleString("en", { weekday: "short" }),
      date: key,
      value: map[key] || 0,
    });
  }
  return out;
}

async function getTopProducts(limit = 5) {
  return Product.find({ isActive: true })
    .sort({ reviewsCount: -1 })
    .limit(limit)
    .select("name price rating reviewsCount images stock")
    .lean();
}

async function getLowStockProducts(limit = 5) {
  return Product.find({ stock: { $lte: 10 } })
    .sort({ stock: 1 })
    .limit(limit)
    .select("name price stock sku")
    .lean();
}

async function getRecentOrders(limit = 6) {
  return Order.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("user", "name email")
    .select("number total status createdAt shippingAddress")
    .lean();
}

async function getRecentReviews(limit = 5) {
  return Review.find({ status: "approved" })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("product", "name slug")
    .select("name rating body createdAt")
    .lean();
}

async function getRecentNotifications(limit = 5) {
  return Notification.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

async function getRecentActivity(limit = 8) {
  const logs = await LogEntry.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("type user action details level createdAt")
    .lean();

  if (logs.length > 0) return logs;

  const activities = [];

  const recentOrders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(3)
    .select("number status createdAt user")
    .populate("user", "name")
    .lean();
  for (const o of recentOrders) {
    activities.push({
      _id: String(o._id),
      type: "activity",
      user: o.user?.name ?? "Customer",
      action: `placed order #${o.number}`,
      details: o.status,
      level: "info",
      createdAt: o.createdAt,
    });
  }

  const recentProducts = await Product.find()
    .sort({ createdAt: -1 })
    .limit(2)
    .select("name createdAt")
    .lean();
  for (const p of recentProducts) {
    activities.push({
      _id: String(p._id),
      type: "activity",
      user: "Admin",
      action: `added product "${p.name}"`,
      details: "create",
      level: "success",
      createdAt: p.createdAt,
    });
  }

  const recentReviews = await Review.find({ status: "approved" })
    .sort({ createdAt: -1 })
    .limit(2)
    .select("name rating body createdAt product")
    .populate("product", "name")
    .lean();
  for (const r of recentReviews) {
    activities.push({
      _id: String(r._id),
      type: "activity",
      user: r.name,
      action: `reviewed "${r.product?.name ?? "a product"}"`,
      details: `${r.rating} stars`,
      level: "info",
      createdAt: r.createdAt,
    });
  }

  activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return activities.slice(0, limit);
}

async function getRevenueComparison() {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const thisYearStart = new Date(now.getFullYear(), 0, 1);
  const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
  const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);

  const [thisMonth, lastMonth, thisYear, lastYear, thisMonthOrders, lastMonthOrders, thisMonthCustomers, lastMonthCustomers] = await Promise.all([
    Order.aggregate([
      { $match: { status: { $ne: "cancelled" }, createdAt: { $gte: thisMonthStart } } },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { status: { $ne: "cancelled" }, createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { status: { $ne: "cancelled" }, createdAt: { $gte: thisYearStart } } },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { status: { $ne: "cancelled" }, createdAt: { $gte: lastYearStart, $lte: lastYearEnd } } },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
    ]),
    User.countDocuments({ role: "customer", createdAt: { $gte: thisMonthStart } }),
    User.countDocuments({ role: "customer", createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } }),
    Order.countDocuments({ createdAt: { $gte: thisMonthStart } }),
    Order.countDocuments({ createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } }),
  ]);

  const tm = thisMonth[0]?.total || 0;
  const lm = lastMonth[0]?.total || 0;
  const ty = thisYear[0]?.total || 0;
  const ly = lastYear[0]?.total || 0;
  const tmOrders = thisMonthOrders || 0;
  const lmOrders = lastMonthOrders || 0;

  const pctChange = (curr, prev) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 1000) / 10;
  };

  return {
    revenue: {
      thisMonth: Math.round(tm * 100) / 100,
      lastMonth: Math.round(lm * 100) / 100,
      change: pctChange(tm, lm),
    },
    yearlyRevenue: {
      thisYear: Math.round(ty * 100) / 100,
      lastYear: Math.round(ly * 100) / 100,
      change: pctChange(ty, ly),
    },
    orders: {
      thisMonth: tmOrders,
      lastMonth: lmOrders,
      change: pctChange(tmOrders, lmOrders),
    },
    customers: {
      thisMonth: thisMonthCustomers,
      lastMonth: lastMonthCustomers,
      change: pctChange(thisMonthCustomers, lastMonthCustomers),
    },
  };
}

export {
  getOverview,
  getRevenueSeries,
  getSalesByCategory,
  getDailyOrders,
  getTopProducts,
  getLowStockProducts,
  getRecentOrders,
  getRecentReviews,
  getRecentNotifications,
  getRecentActivity,
  getRevenueComparison,
};
