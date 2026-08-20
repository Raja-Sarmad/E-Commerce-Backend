import mongoose from "mongoose";
import { PAYMENT_STATUSES } from "../../constants/index.js";
import { generateReference } from "../../utils/generator.js";

const paymentMethodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    enabled: { type: Boolean, default: false, index: true },
    icon: { type: String, default: "" },
    settings: { type: Map, of: String, default: {} },
  },
  { timestamps: true }
);

const transactionSchema = new mongoose.Schema(
  {
    reference: { type: String, unique: true, default: generateReference },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    orderNumber: { type: String, default: "" },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    customerName: { type: String, default: "" },
    amount: { type: Number, required: true, min: 0 },
    fee: { type: Number, default: 0 },
    method: { type: String, default: "card" },
    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: "pending",
      index: true,
    },
    gatewayRef: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ order: 1 });
transactionSchema.index({ customer: 1, createdAt: -1 });

const PaymentMethod = mongoose.model("PaymentMethod", paymentMethodSchema);
const Transaction = mongoose.model("Transaction", transactionSchema);

export { PaymentMethod, Transaction };