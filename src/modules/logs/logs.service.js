import LogEntry from "./logs.model.js";
import Order from "../orders/orders.model.js";
import Product from "../products/products.model.js";
import Review from "../reviews/reviews.model.js";
import { getPagination, getPaginationMeta, getSort } from "../../utils/pagination.js";
import { applyDateRangeFilter } from "../../utils/dateRange.js";

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || "";
}

function actorLabel(req) {
  if (!req?.user) return "Guest";
  return req.user.email || req.user.name || String(req.user._id);
}

/**
 * Write a log entry. Fire-and-forget (never throws).
 */
async function logActivity({ type, user, action, details, ip, level, metadata }) {
  try {
    await LogEntry.create({ type, user, action, details, ip, level, metadata });
  } catch (err) {
    console.error("[logs] Failed to write log:", err.message);
  }
}

async function logFromRequest(
  req,
  { type, action, details = "", level = "info", metadata } = {}
) {
  return logActivity({
    type,
    user: actorLabel(req),
    action,
    details,
    ip: getClientIp(req),
    level,
    metadata,
  });
}

/** Seed logs from recent store activity when the log collection is empty. */
async function backfillRecentLogsIfEmpty() {
  const count = await LogEntry.countDocuments();
  if (count > 0) return;

  const entries = [];

  const recentOrders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .select("number status createdAt user")
    .populate("user", "name email")
    .lean();

  for (const order of recentOrders) {
    entries.push({
      type: "activity",
      user: order.user?.name || order.user?.email || "Customer",
      action: `Placed order #${order.number}`,
      details: `Status: ${order.status}`,
      level: "info",
      createdAt: order.createdAt,
    });
  }

  const recentProducts = await Product.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .select("name createdAt")
    .lean();

  for (const product of recentProducts) {
    entries.push({
      type: "audit",
      user: "Admin",
      action: `Product added: ${product.name}`,
      details: "Catalog update",
      level: "success",
      createdAt: product.createdAt,
    });
  }

  const recentReviews = await Review.find({ status: "approved" })
    .sort({ createdAt: -1 })
    .limit(5)
    .select("name rating createdAt product")
    .populate("product", "name")
    .lean();

  for (const review of recentReviews) {
    entries.push({
      type: "activity",
      user: review.name || "Customer",
      action: `Reviewed "${review.product?.name ?? "a product"}"`,
      details: `${review.rating} stars`,
      level: "info",
      createdAt: review.createdAt,
    });
  }

  if (entries.length === 0) return;

  entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  try {
    await LogEntry.insertMany(entries.slice(0, 25));
  } catch (err) {
    console.error("[logs] Backfill failed:", err.message);
  }
}

async function listLogs(query) {
  await backfillRecentLogsIfEmpty();

  const { page, limit, skip } = getPagination(query);
  const sort = getSort(query, ["createdAt", "level"]);

  const filter = {};
  if (query.type) filter.type = query.type;
  if (query.level) filter.level = query.level;
  if (query.search) filter.$or = [{ user: new RegExp(query.search.trim(), "i") }, { action: new RegExp(query.search.trim(), "i") }];
  applyDateRangeFilter(filter, query);

  const [logs, total] = await Promise.all([
    LogEntry.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    LogEntry.countDocuments(filter),
  ]);

  return {
    logs,
    meta: getPaginationMeta({ page, limit, total, totalPages: Math.ceil(total / limit) }),
  };
}

async function clearLogs() {
  await LogEntry.deleteMany({});
}

export { logActivity, logFromRequest, listLogs, clearLogs };
