import Notification from "./notifications.model.js";
import AppError from "../../utils/AppError.js";
import { getPagination, getPaginationMeta } from "../../utils/pagination.js";

/**
 * Create a notification. Fire-and-forget — never throws into the caller.
 */
async function createNotification({ type, title, message, link, audience = "admin", userId }) {
  try {
    return await Notification.create({ type, title, message, link, audience, userId });
  } catch (err) {
    console.error("[notifications] Failed to create:", err.message);
    return null;
  }
}

/**
 * Notify admins about a low-stock product.
 */
async function checkLowStock(product) {
  if (!product) return;
  const threshold = product.lowStockThreshold ?? 10;
  if (product.stock === 0) {
    await createNotification({
      type: "stock",
      title: "Product out of stock",
      message: `"${product.name}" is now out of stock.`,
      link: "/admin/inventory",
    });
  } else if (product.stock <= threshold) {
    await createNotification({
      type: "stock",
      title: "Low stock alert",
      message: `Only ${product.stock} units left of "${product.name}".`,
      link: "/admin/inventory",
    });
  }
}

async function listNotifications(query, { admin = false, userId } = {}) {
  const { page, limit, skip } = getPagination(query);

  const filter = {};
  if (admin) {
    filter.audience = { $in: ["admin", "all"] };
  } else {
    filter.audience = { $in: ["user", "all"] };
    if (userId) filter.userId = userId;
  }
  if (query.type) filter.type = query.type;
  if (query.read === "true") filter.read = true;
  if (query.read === "false") filter.read = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, read: false }),
  ]);

  return {
    notifications,
    unreadCount,
    meta: getPaginationMeta({ page, limit, total, totalPages: Math.ceil(total / limit) }),
  };
}

async function markAsRead(notificationId) {
  const notification = await Notification.findByIdAndUpdate(
    notificationId,
    { read: true, readAt: new Date() },
    { new: true }
  );
  if (!notification) throw new AppErrorNotFound();
  return notification;
}

async function markAllAsRead(filter = {}) {
  return Notification.updateMany(filter, { read: true, readAt: new Date() });
}

async function deleteNotification(notificationId) {
  const notification = await Notification.findByIdAndDelete(notificationId);
  if (!notification) throw new AppErrorNotFound();
  return notification;
}

function AppErrorNotFound() {
  return new AppError("Notification not found.", 404);
}

export {
  createNotification,
  checkLowStock,
  listNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
