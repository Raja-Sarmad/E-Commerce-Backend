import mongoose from "mongoose";
import { DEFAULT_SETTINGS } from "../../constants/index.js";

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "store" },
    storeName: { type: String, default: DEFAULT_SETTINGS.storeName },
    storeEmail: { type: String, default: DEFAULT_SETTINGS.storeEmail },
    supportPhone: { type: String, default: DEFAULT_SETTINGS.supportPhone },
    currency: { type: String, default: DEFAULT_SETTINGS.currency },
    currencySymbol: { type: String, default: DEFAULT_SETTINGS.currencySymbol },
    taxRate: { type: Number, default: DEFAULT_SETTINGS.taxRate, min: 0, max: 100 },
    freeShippingThreshold: { type: Number, default: DEFAULT_SETTINGS.freeShippingThreshold },
    defaultShippingRate: { type: Number, default: DEFAULT_SETTINGS.defaultShippingRate },
    lowStockThreshold: { type: Number, default: DEFAULT_SETTINGS.lowStockThreshold },
    maxOrderItems: { type: Number, default: DEFAULT_SETTINGS.maxOrderItems },
    maintenanceMode: { type: Boolean, default: false },
    emailTemplates: {
      type: Map,
      of: new mongoose.Schema({ subject: String, body: String }, { _id: false }),
      default: {},
    },
  },
  { timestamps: true }
);

const Settings = mongoose.model("Settings", settingsSchema);

export default Settings;
