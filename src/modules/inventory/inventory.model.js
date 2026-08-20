import mongoose from "mongoose";

const inventoryEntrySchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    productName: { type: String, required: true },
    sku: { type: String, default: "" },
    previous: { type: Number, required: true },
    adjustment: { type: Number, required: true },
    current: { type: Number, required: true },
    reason: { type: String, default: "" },
    user: { type: String, default: "System" },
  },
  { timestamps: true }
);

inventoryEntrySchema.index({ product: 1, createdAt: -1 });
inventoryEntrySchema.index({ createdAt: -1 });

const InventoryEntry = mongoose.model("InventoryEntry", inventoryEntrySchema);

export default InventoryEntry;
