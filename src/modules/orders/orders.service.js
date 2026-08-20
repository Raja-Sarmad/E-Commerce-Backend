import Order from "./orders.model.js";
import Product from "../products/products.model.js";
import User from "../users/users.model.js";
import AppError from "../../utils/AppError.js";
import { getPagination, getPaginationMeta, getSort } from "../../utils/pagination.js";
import * as couponService from "../coupons/coupons.service.js";
import * as settingsService from "../settings/settings.service.js";
import { createNotification } from "../notifications/notifications.service.js";
import { sendEmail, orderConfirmationEmail } from "../../utils/email.js";

const ORDERABLE_STATUS = new Set(["pending", "processing", "shipped", "delivered", "cancelled"]);

async function createOrder(userId, data) {
  const settings = await settingsService.getSettings();
  const { items, couponCode, shippingAddress, billingAddress, paymentMethod } = data;

  if (!items || items.length === 0) {
    throw new AppError("Order must contain at least one item.", 400);
  }
  if (items.length > settings.maxOrderItems) {
    throw new AppError(`A single order can contain at most ${settings.maxOrderItems} items.`, 400);
  }

  const ids = items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: ids }, isActive: true });

  const productMap = new Map(products.map((p) => [String(p._id), p]));

  const orderItems = items.map((item) => {
    const product = productMap.get(String(item.productId));
    if (!product) throw new AppError(`Product not found for item.`, 400);
    if (product.stock < item.quantity) {
      throw new AppError(`Insufficient stock for "${product.name}". Only ${product.stock} left.`, 400);
    }
    return {
      productId: product._id,
      name: product.name,
      image: product.images[0] || "",
      price: product.price,
      quantity: item.quantity,
      color: item.color || null,
      size: item.size || null,
    };
  });

  const subtotal = Math.round(orderItems.reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100;

  let discount = 0;
  let coupon = null;
  if (couponCode) {
    const result = await couponService.validateCoupon(couponCode, { subtotal, userId });
    coupon = result.coupon;
    discount = result.discount;
  }

  const shipping =
    subtotal - discount >= settings.freeShippingThreshold ? 0 : settings.defaultShippingRate;
  const tax = Math.round((subtotal - discount) * (settings.taxRate / 100) * 100) / 100;
  const total = Math.round((subtotal - discount + shipping + tax) * 100) / 100;

  const order = await Order.create({
    user: userId,
    items: orderItems,
    subtotal,
    discount,
    shipping,
    tax,
    total,
    couponCode: coupon ? coupon.code : null,
    coupon: coupon ? coupon._id : null,
    shippingAddress,
    billingAddress: billingAddress || shippingAddress,
    paymentMethod,
    payment: {
      status: paymentMethod === "cod" ? "pending" : "succeeded",
      method: paymentMethod,
    },
    status: "pending",
    estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  // decrement stock
  for (const item of orderItems) {
    const product = productMap.get(String(item.productId));
    await Product.findByIdAndUpdate(product._id, {
      $inc: { stock: -item.quantity },
    });
  }

  // record coupon usage
  if (coupon) await couponService.recordUsage(coupon._id, userId);

  // update user stats
  await User.findByIdAndUpdate(userId, {
    $inc: { ordersCount: 1, totalSpent: total },
  });

  // notifications + email (fire and forget)
  await createNotification({
    type: "order",
    title: "New order received",
    message: `Order ${order.number} was placed.`,
    link: "/admin/orders",
  });
  const user = await User.findById(userId).lean();
  await sendEmail({
    to: user.email,
    subject: `Order confirmation #${order.number}`,
    html: orderConfirmationEmail(user.name, order.number, `$${total.toFixed(2)}`),
  });

  return order;
}

async function listMyOrders(userId, query) {
  const { page, limit, skip } = getPagination(query);
  const sort = getSort(query, ["createdAt", "total", "status"]);

  const filter = { user: userId };
  if (query.status && ORDERABLE_STATUS.has(query.status)) filter.status = query.status;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);

  return {
    orders,
    meta: getPaginationMeta({ page, limit, total, totalPages: Math.ceil(total / limit) }),
  };
}

async function getMyOrderByNumber(userId, number) {
  const order = await Order.findOne({ user: userId, number }).lean();
  if (!order) throw new AppError("Order not found.", 404);
  return order;
}

async function listAllOrders(query) {
  const { page, limit, skip } = getPagination(query);
  const sort = getSort(query, ["createdAt", "total", "status", "number"]);

  const filter = {};
  if (query.status && ORDERABLE_STATUS.has(query.status)) filter.status = query.status;
  if (query.search) {
    filter.$or = [
      { number: new RegExp(query.search.trim(), "i") },
      { "shippingAddress.lastName": new RegExp(query.search.trim(), "i") },
      { "shippingAddress.firstName": new RegExp(query.search.trim(), "i") },
    ];
  }
  if (query.paymentStatus) filter["payment.status"] = query.paymentStatus;
  if (query.user) filter.user = query.user;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("user", "name email")
      .lean(),
    Order.countDocuments(filter),
  ]);

  return {
    orders,
    meta: getPaginationMeta({ page, limit, total, totalPages: Math.ceil(total / limit) }),
  };
}

async function getOrderByNumber(number) {
  const order = await Order.findOne({ number }).populate("user", "name email").lean();
  if (!order) throw new AppError("Order not found.", 404);
  return order;
}

async function updateOrderStatus(orderId, status, note = "") {
  if (!ORDERABLE_STATUS.has(status)) throw new AppError("Invalid order status.", 400);

  const order = await Order.findById(orderId);
  if (!order) throw new AppError("Order not found.", 404);

  order.status = status;
  if (status === "delivered") order.deliveredAt = new Date();
  if (status === "cancelled") order.cancelledAt = new Date();
  order.timeline.push({ status, date: new Date(), note });
  await order.save();

  if (status === "cancelled") {
    // restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
    }
  }

  await createNotification({
    type: "order",
    title: `Order ${order.number} ${status}`,
    message: `Order #${order.number} status changed to ${status}.`,
    link: "/admin/orders",
  });

  return order;
}

async function addTracking(orderId, { carrier, trackingNumber }) {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError("Order not found.", 404);
  order.tracking.carrier = carrier;
  order.tracking.trackingNumber = trackingNumber;
  order.tracking.events.push({
    date: new Date(),
    label: "Order shipped",
    location: "Carrier facility",
  });
  await order.save();
  return order;
}

async function cancelOrder(userId, orderId, reason = "") {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError("Order not found.", 404);
  if (String(order.user) !== String(userId)) {
    throw new AppError("You do not have permission to cancel this order.", 403);
  }
  if (!["pending", "processing"].includes(order.status)) {
    throw new AppError("Only pending or processing orders can be cancelled.", 400);
  }

  order.status = "cancelled";
  order.cancelledAt = new Date();
  order.cancelReason = reason;
  order.timeline.push({ status: "cancelled", date: new Date(), note: reason });
  await order.save();

  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
  }

  return order;
}

export {
  createOrder,
  listMyOrders,
  getMyOrderByNumber,
  listAllOrders,
  getOrderByNumber,
  updateOrderStatus,
  addTracking,
  cancelOrder,
};
