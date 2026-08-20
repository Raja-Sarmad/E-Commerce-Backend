import { PaymentMethod, Transaction } from "./payments.model.js";
import AppError from "../../utils/AppError.js";
import { getPagination, getPaginationMeta, getSort } from "../../utils/pagination.js";
import { createNotification } from "../notifications/notifications.service.js";

const defaultMethods = [
  { name: "Stripe", description: "Credit & debit card processing", enabled: true, icon: "stripe" },
  { name: "PayPal", description: "PayPal balance & linked cards", enabled: false, icon: "paypal" },
  { name: "Cash on Delivery", description: "Collect payment at delivery", enabled: true, icon: "cod" },
  { name: "Apple Pay", description: "One-tap checkout on Apple devices", enabled: false, icon: "applepay" },
  { name: "Google Pay", description: "One-tap checkout on Android", enabled: false, icon: "googlepay" },
];

async function ensureDefaultMethods() {
  const count = await PaymentMethod.countDocuments();
  if (count === 0) await PaymentMethod.insertMany(defaultMethods);
}

async function listPaymentMethods({ enabledOnly = false } = {}) {
  const filter = enabledOnly ? { enabled: true } : {};
  return PaymentMethod.find(filter).sort({ name: 1 }).lean();
}

async function getPaymentMethod(id) {
  const method = await PaymentMethod.findById(id);
  if (!method) throw new AppError("Payment method not found.", 404);
  return method;
}

async function updatePaymentMethod(id, data) {
  const method = await PaymentMethod.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!method) throw new AppError("Payment method not found.", 404);
  return method;
}

async function listTransactions(query) {
  const { page, limit, skip } = getPagination(query);
  const sort = getSort(query, ["createdAt", "amount"]);

  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.method) filter.method = query.method;
  if (query.search) {
    filter.$or = [
      { reference: new RegExp(query.search.trim(), "i") },
      { orderNumber: new RegExp(query.search.trim(), "i") },
      { customerName: new RegExp(query.search.trim(), "i") },
    ];
  }

  const [transactions, total] = await Promise.all([
    Transaction.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Transaction.countDocuments(filter),
  ]);

  return {
    transactions,
    meta: getPaginationMeta({ page, limit, total, totalPages: Math.ceil(total / limit) }),
  };
}

async function createTransaction({ order, orderNumber, customer, customerName, amount, method, gatewayRef }) {
  const fee = Math.round(amount * 0.029 * 100) / 100 + 0.3;
  const transaction = await Transaction.create({
    order,
    orderNumber,
    customer,
    customerName,
    amount,
    fee,
    method,
    status: "succeeded",
    gatewayRef,
  });
  await createNotification({
    type: "order",
    title: "Payment received",
    message: `Payment of $${amount.toFixed(2)} received for order ${orderNumber}.`,
    link: "/admin/payments",
  });
  return transaction;
}

async function updateTransactionStatus(id, status) {
  const transaction = await Transaction.findByIdAndUpdate(id, { status }, { new: true });
  if (!transaction) throw new AppError("Transaction not found.", 404);
  return transaction;
}

export {
  ensureDefaultMethods,
  listPaymentMethods,
  getPaymentMethod,
  updatePaymentMethod,
  listTransactions,
  createTransaction,
  updateTransactionStatus,
};
