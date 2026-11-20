import Order from "./orders.model.js";
import Product from "../products/products.model.js";
import User from "../users/users.model.js";
import AppError from "../../utils/AppError.js";
import { getPagination, getPaginationMeta, getSort } from "../../utils/pagination.js";
import { applyDateRangeFilter } from "../../utils/dateRange.js";
import * as couponService from "../coupons/coupons.service.js";
import * as settingsService from "../settings/settings.service.js";
import { createNotification } from "../notifications/notifications.service.js";
import { sendTemplateEmail, orderConfirmationEmail, orderAdminNotifyEmail } from "../../utils/email.js";
import { clearCatalogCache } from "../../utils/catalogCache.js";
import config from "../../config/index.js";

const ORDERABLE_STATUS = new Set(["pending", "processing", "shipped", "delivered", "cancelled"]);

/** Sab Pehno storefront PKR → USD (matches Store/lib/money.ts). */
const SABPEHNO_PKR_RATE = 278;
const SABPEHNO_KARACHI_DC_PKR = 300;
const SABPEHNO_OUTSIDE_DC_PKR = 350;

function isKarachiCity(city = "") {
  return /karachi/i.test(String(city || "").trim());
}

function sabPehnoDeliveryUsd(city = "") {
  const pkr = isKarachiCity(city) ? SABPEHNO_KARACHI_DC_PKR : SABPEHNO_OUTSIDE_DC_PKR;
  return Math.round((pkr / SABPEHNO_PKR_RATE) * 10000) / 10000;
}

async function createOrder(userId, data, store) {
  const storeId = store?._id || store;
  const storeSlug = store?.slug || "";
  if (!storeId) throw new AppError("Store context is required.", 500);
  const settings = await settingsService.getSettings();
  const { items, couponCode, shippingAddress, billingAddress, paymentMethod, deliveryOption } = data;

  if (!items || items.length === 0) {
    throw new AppError("Order must contain at least one item.", 400);
  }
  if (items.length > settings.maxOrderItems) {
    throw new AppError(`A single order can contain at most ${settings.maxOrderItems} items.`, 400);
  }

  const ids = items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: ids }, storeId, isActive: true });

  const productMap = new Map(products.map((p) => [String(p._id), p]));

  const orderItems = items.map((item) => {
    const product = productMap.get(String(item.productId));
    if (!product) throw new AppError(`Product not found for item.`, 400);
    const qty = Math.max(1, Math.floor(Number(item.quantity) || 0));
    if (!Number.isFinite(qty) || qty < 1) {
      throw new AppError(`Invalid quantity for "${product.name}".`, 400);
    }

    const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
    if (hasVariants && !item.size) {
      throw new AppError(
        `Please select a size for "${product.name}" before placing the order.`,
        400
      );
    }
    if (hasVariants) {
      const variant = product.variants.find((v) => v.size === item.size);
      if (!variant) {
        throw new AppError(`Size "${item.size}" not available for "${product.name}".`, 400);
      }
    }

    return {
      productId: product._id,
      name: product.name,
      image: product.images[0] || "",
      price: product.price,
      quantity: qty,
      color: item.color || null,
      size: item.size || null,
    };
  });

  // Merge demand by product + size so split cart lines cannot oversell.
  const demandByKey = new Map();
  for (const item of orderItems) {
    const product = productMap.get(String(item.productId));
    const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
    const key = hasVariants
      ? `${item.productId}|size|${item.size}`
      : `${item.productId}|product`;
    const prev = demandByKey.get(key);
    if (prev) prev.quantity += item.quantity;
    else {
      demandByKey.set(key, {
        productId: item.productId,
        name: item.name,
        size: hasVariants ? item.size : null,
        quantity: item.quantity,
        hasVariants,
      });
    }
  }

  for (const demand of demandByKey.values()) {
    const product = productMap.get(String(demand.productId));
    if (demand.hasVariants) {
      const variant = product.variants.find((v) => v.size === demand.size);
      if (!variant || variant.stock < demand.quantity) {
        throw new AppError(
          `Insufficient stock for "${demand.name}" (size: ${demand.size}). Only ${variant?.stock ?? 0} left.`,
          400
        );
      }
    } else if (product.stock < demand.quantity) {
      throw new AppError(
        `Insufficient stock for "${demand.name}". Only ${product.stock} left.`,
        400
      );
    }
  }

  const subtotal = Math.round(orderItems.reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100;

  let discount = 0;
  let coupon = null;
  if (couponCode) {
    const result = await couponService.validateCoupon(couponCode, { subtotal, userId });
    coupon = result.coupon;
    discount = result.discount;
  }

  let shipping;
  let tax;
  if (storeSlug === "store") {
    // Sab Pehno: Karachi Rs 300 · rest of Pakistan Rs 350 (stored as USD for PKR display).
    if (!shippingAddress?.city?.trim()) {
      throw new AppError("Please enter your city so we can calculate delivery charges.", 400);
    }
    shipping = sabPehnoDeliveryUsd(shippingAddress.city);
    tax = 0;
  } else {
    let baseShipping =
      subtotal - discount >= settings.freeShippingThreshold ? 0 : settings.defaultShippingRate;
    if (deliveryOption === "express") baseShipping += 12;
    else if (deliveryOption === "nextday") baseShipping += 25;
    shipping = baseShipping;
    tax = Math.round((subtotal - discount) * (settings.taxRate / 100) * 100) / 100;
  }
  const total = Math.round((subtotal - discount + shipping + tax) * 100) / 100;

  const decremented = [];
  try {
    for (const demand of demandByKey.values()) {
      if (demand.hasVariants) {
        const updated = await Product.findOneAndUpdate(
          {
            _id: demand.productId,
            isActive: true,
            variants: {
              $elemMatch: { size: demand.size, stock: { $gte: demand.quantity } },
            },
          },
          {
            $inc: {
              "variants.$.stock": -demand.quantity,
              totalSold: demand.quantity,
            },
          },
          { new: true }
        );
        if (!updated) {
          throw new AppError(
            `Insufficient stock for "${demand.name}" (size: ${demand.size}). Please refresh your cart and try again.`,
            400
          );
        }
        // Keep product.stock in sync with size stocks (0 => sold out on storefront).
        updated.stock = updated.variants.reduce((sum, v) => sum + Math.max(0, v.stock || 0), 0);
        if (updated.stock < 0) updated.stock = 0;
        await updated.save();
        decremented.push({
          productId: demand.productId,
          quantity: demand.quantity,
          size: demand.size,
        });
      } else {
        const updated = await Product.findOneAndUpdate(
          { _id: demand.productId, stock: { $gte: demand.quantity }, isActive: true },
          { $inc: { stock: -demand.quantity, totalSold: demand.quantity } },
          { new: true }
        );
        if (!updated) {
          throw new AppError(
            `Insufficient stock for "${demand.name}". Please refresh your cart and try again.`,
            400
          );
        }
        decremented.push({ productId: demand.productId, quantity: demand.quantity });
      }
    }

    const order = await Order.create({
      storeId,
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
    clearCatalogCache();

    if (coupon) await couponService.recordUsage(coupon._id, userId);

    await User.findByIdAndUpdate(userId, {
      $inc: { ordersCount: 1, totalSpent: total },
    });

    await createNotification({
      type: "order",
      title: "New order received",
      message: `Order ${order.number} was placed.`,
      link: "/admin/orders",
    });
    const user = await User.findById(userId).lean();
    const totalLabel = `$${Number(total).toFixed(2)}`;

    // Customer confirmation
    if (user?.email) {
      await sendTemplateEmail(
        user.email,
        orderConfirmationEmail(user.name, order.number, totalLabel)
      );
    }

    // Admin / store inbox alert
    const adminInbox = config.mail.orderNotifyEmail;
    if (adminInbox) {
      await sendTemplateEmail(
        adminInbox,
        orderAdminNotifyEmail({
          customerName: user?.name || "Customer",
          customerEmail: user?.email || "",
          orderNumber: order.number,
          total: totalLabel,
          paymentMethod: paymentMethod || "cod",
          items: orderItems.map((item) => ({
            name: item.name,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            price: `$${Number(item.price).toFixed(2)}`,
          })),
          shippingAddress: shippingAddress || {},
        })
      );
    }

    return order;
  } catch (err) {
    for (const row of decremented) {
      if (row.size) {
        // Rollback variant-level stock
        await Product.findOneAndUpdate(
          { _id: row.productId, "variants.size": row.size },
          {
            $inc: {
              "variants.$.stock": row.quantity,
              totalSold: -row.quantity,
            },
          }
        );
        // Sync total stock
        const product = await Product.findById(row.productId);
        if (product) {
          product.stock = product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
          await product.save();
        }
      } else {
        await Product.findByIdAndUpdate(row.productId, {
          $inc: { stock: row.quantity, totalSold: -row.quantity },
        });
      }
    }
    throw err;
  }
}

async function listMyOrders(userId, query, storeId) {
  const { page, limit, skip } = getPagination(query);
  const sort = getSort(query, ["createdAt", "total", "status"]);

  const filter = { user: userId, storeId };
  if (query.status && ORDERABLE_STATUS.has(query.status)) filter.status = query.status;
  if (query.search) {
    filter.number = new RegExp(query.search.trim(), "i");
  }
  applyDateRangeFilter(filter, query);

  const [orders, total] = await Promise.all([
    Order.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);

  return {
    orders,
    meta: getPaginationMeta({ page, limit, total, totalPages: Math.ceil(total / limit) }),
  };
}

async function getMyOrderByNumber(userId, number, storeId) {
  const order = await Order.findOne({ user: userId, number, storeId }).lean();
  if (!order) throw new AppError("Order not found.", 404);
  return order;
}

async function listAllOrders(query, storeId) {
  const { page, limit, skip } = getPagination(query);
  const sort = getSort(query, ["createdAt", "total", "status", "number"]);

  const filter = { storeId };
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
  applyDateRangeFilter(filter, query);

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

async function getOrderByNumber(number, storeId) {
  const order = await Order.findOne({ number, storeId }).populate("user", "name email").lean();
  if (!order) throw new AppError("Order not found.", 404);
  return order;
}

async function updateOrderStatus(orderId, status, note = "", storeId) {
  if (!ORDERABLE_STATUS.has(status)) throw new AppError("Invalid order status.", 400);

  const order = await Order.findOne({ _id: orderId, storeId });
  if (!order) throw new AppError("Order not found.", 404);

  order.status = status;
  if (status === "delivered") order.deliveredAt = new Date();
  if (status === "cancelled") order.cancelledAt = new Date();
  order.timeline.push({ status, date: new Date(), note });
  await order.save();

  if (status === "cancelled") {
    for (const item of order.items) {
      if (item.size) {
        // Restore variant-level stock
        await Product.findOneAndUpdate(
          { _id: item.productId, "variants.size": item.size },
          {
            $inc: {
              "variants.$.stock": item.quantity,
              totalSold: -item.quantity,
            },
          }
        );
        // Sync total stock
        const product = await Product.findById(item.productId);
        if (product) {
          product.stock = product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
          await product.save();
        }
      } else {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.quantity, totalSold: -item.quantity },
        });
      }
    }
    clearCatalogCache();
  }

  await createNotification({
    type: "order",
    title: `Order ${order.number} ${status}`,
    message: `Order #${order.number} status changed to ${status}.`,
    link: "/admin/orders",
  });

  return order;
}

async function addTracking(orderId, { carrier, trackingNumber }, storeId) {
  const order = await Order.findOne({ _id: orderId, storeId });
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

async function cancelOrder(userId, orderId, reason = "", storeId) {
  const order = await Order.findOne({ _id: orderId, storeId });
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
    if (item.size) {
      // Restore variant-level stock
      await Product.findOneAndUpdate(
        { _id: item.productId, "variants.size": item.size },
        {
          $inc: {
            "variants.$.stock": item.quantity,
            totalSold: -item.quantity,
          },
        }
      );
      const product = await Product.findById(item.productId);
      if (product) {
        product.stock = product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
        await product.save();
      }
    } else {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity, totalSold: -item.quantity },
      });
    }
  }
  clearCatalogCache();

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
