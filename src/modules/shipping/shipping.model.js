import mongoose from "mongoose";

const shippingZoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Zone name is required."], trim: true },
    regions: { type: String, default: "" },
    countries: [{ type: String }],
    baseRate: { type: Number, default: 0, min: 0 },
    freeAbove: { type: Number, default: 0, min: 0 },
    methods: [{ type: String }],
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

const shippingMethodSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Method name is required."], trim: true },
    zone: { type: String, trim: true, default: "" },
    zoneRef: { type: mongoose.Schema.Types.ObjectId, ref: "ShippingZone", default: null },
    price: { type: Number, default: 0, min: 0 },
    eta: { type: String, default: "" },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

shippingZoneSchema.index({ active: 1, name: 1 });
shippingMethodSchema.index({ zone: 1, active: 1 });

const ShippingZone = mongoose.model("ShippingZone", shippingZoneSchema);
const ShippingMethod = mongoose.model("ShippingMethod", shippingMethodSchema);

export { ShippingZone, ShippingMethod };
