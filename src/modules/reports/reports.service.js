import Order from "../orders/orders.model.js";
import Product from "../products/products.model.js";
import { Transaction } from "../payments/payments.model.js";
import Vendor from "../vendors/vendors.model.js";
import { getPagination, getPaginationMeta } from "../../utils/pagination.js";

/**
 * Sales report — revenue, orders, items sold, discount/shipping/tax
 * grouped by day, month, or year within a range.
 */
async function salesReport(query) {
  const { page, limit, skip } = getPagination(query);
  const groupBy = query.groupBy || "month";
  const start = query.start ? new Date(query.start) : new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const end = query.end ? new Date(query.end) : new Date();

  const fmt =
    groupBy === "day" ? "%Y-%m-%d"
      : groupBy === "year" ? "%Y"
        : "%Y-%m";

  const pipeline = [
    { $match: { createdAt: { $gte: start, $lte: end }, status: { $ne: "cancelled" } } },
    {
      $group: {
        _id: { $dateToString: { format: fmt, date: "$createdAt" } },
        revenue: { $sum: "$total" },
        orders: { $sum: 1 },
        itemsSold: { $sum: { $sum: "$items.quantity" } },
        discount: { $sum: "$discount" },
        shipping: { $sum: "$shipping" },
        tax: { $sum: "$tax" },
      },
    },
    { $sort: { _id: 1 } },
  ];

  const rows = await Order.aggregate(pipeline);
  const total = rows.length;

  return {
    rows: rows.slice(skip, skip + limit),
    totals: {
      revenue: Math.round(rows.reduce((s, r) => s + r.revenue, 0) * 100) / 100,
      orders: rows.reduce((s, r) => s + r.orders, 0),
      itemsSold: rows.reduce((s, r) => s + r.itemsSold, 0),
      discount: Math.round(rows.reduce((s, r) => s + r.discount, 0) * 100) / 100,
      shipping: Math.round(rows.reduce((s, r) => s + r.shipping, 0) * 100) / 100,
      tax: Math.round(rows.reduce((s, r) => s + r.tax, 0) * 100) / 100,
    },
    meta: getPaginationMeta({ page, limit, total, totalPages: Math.ceil(total / limit) }),
  };
}

/**
 * Inventory report — stock value, low/out of stock counts.
 */
async function inventoryReport() {
  const [rows, stats] = await Promise.all([
    Product.find({})
      .select("name sku stock price lowStockThreshold category isActive")
      .sort({ stock: 1 })
      .lean(),
    Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalUnits: { $sum: "$stock" },
          stockValue: { $sum: { $multiply: ["$stock", "$price"] } },
          lowStock: { $sum: { $cond: [{ $and: [{ $gt: ["$stock", 0] }, { $lte: ["$stock", 10] }] }, 1, 0] } },
          outOfStock: { $sum: { $cond: [{ $eq: ["$stock", 0] }, 1, 0] } },
        },
      },
    ]),
  ]);

  return {
    products: rows,
    stats: stats[0] || { totalProducts: 0, totalUnits: 0, stockValue: 0, lowStock: 0, outOfStock: 0 },
  };
}

/**
 * Customer report — top customers by spend.
 */
async function customerReport(query) {
  const { page, limit, skip } = getPagination(query);

  const rows = await Order.aggregate([
    { $group: { _id: "$user", orders: { $sum: 1 }, spent: { $sum: "$total" } } },
    { $sort: { spent: -1 } },
    { $skip: skip },
    { $limit: limit },
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        orders: 1,
        spent: { $round: ["$spent", 2] },
        name: "$user.name",
        email: "$user.email",
        role: "$user.role",
      },
    },
  ]);

  const [{ total } = { total: 0 }] = await Order.aggregate([
    { $group: { _id: "$user" } },
    { $count: "total" },
  ]);

  return {
    customers: rows,
    meta: getPaginationMeta({ page, limit, total, totalPages: Math.ceil(total / limit) }),
  };
}

/**
 * Payments report — transactions grouped by status and method.
 */
async function paymentsReport() {
  const [byStatus, byMethod, totals] = await Promise.all([
    Transaction.aggregate([{ $group: { _id: "$status", count: { $sum: 1 }, amount: { $sum: "$amount" } } }]),
    Transaction.aggregate([{ $group: { _id: "$method", count: { $sum: 1 }, amount: { $sum: "$amount" } } }]),
    Transaction.aggregate([{ $group: { _id: null, count: { $sum: 1 }, gross: { $sum: "$amount" }, fees: { $sum: "$fee" } } }]),
  ]);

  return {
    byStatus,
    byMethod,
    totals: totals[0] || { count: 0, gross: 0, fees: 0 },
  };
}

/**
 * Vendor report — performance summary per vendor.
 */
async function vendorReport() {
  return Vendor.find().sort({ totalEarnings: -1 }).lean();
}

export { salesReport, inventoryReport, customerReport, paymentsReport, vendorReport };
