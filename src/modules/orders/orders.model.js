import mongoose from "mongoose";
import { ORDER_STATUSES } from "../../constants/index.js";
import { generateOrderNumber } from "../../utils/generator.js";

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    image: { type: String, default: "" },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    color: { type: String, default: null },
    size: { type: String, default: null },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    address: String,
    city: String,
    state: String,
    zip: String,
    country: String,
    phone: String,
  },
  { _id: false }
);

const trackingEventSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    label: String,
    location: String,
  },
  { _id: false }
);

const timelineSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ORDER_STATUSES },
    date: { type: Date, default: Date.now },
    note: { type: String, default: "" },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    number: {
      type: String,
      unique: true,
      index: true,
      default: generateOrderNumber,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Order must belong to a user."],
      index: true,
    },

    items: { type: [orderItemSchema], required: [true, "Order must have items."], validate: [(v) => v.length > 0, "Order must have at least one item."] },

    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    shipping: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },

    couponCode: { type: String, default: null },
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon", default: null },

    shippingAddress: { type: addressSchema, required: true },
    billingAddress: { type: addressSchema, required: true },

    paymentMethod: { type: String, required: true },
    payment: {
      status: {
        type: String,
        enum: ["pending", "succeeded", "failed", "refunded"],
        default: "pending",
      },
      method: { type: String, default: "" },
      reference: { type: String, default: "" },
      transactionId: { type: String, default: "" },
    },

    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "pending",
      index: true,
    },

    estimatedDelivery: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancelReason: { type: String, default: "" },

    tracking: {
      carrier: { type: String, default: "" },
      trackingNumber: { type: String, default: "" },
      events: { type: [trackingEventSchema], default: [] },
    },

    timeline: { type: [timelineSchema], default: [] },
  },
  { timestamps: true }
);

/* ── Indexes (query optimization) ───────────────────────────── */
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ "payment.status": 1, createdAt: -1 });

orderSchema.pre("save", function (next) {
  if (!this.timeline.some((t) => t.status === this.status)) {
    this.timeline.push({ status: this.status, date: new Date() });
  }
  next();
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
