import Settings from "./settings.model.js";
import AppError from "../../utils/AppError.js";
import { DEFAULT_SETTINGS } from "../../constants/index.js";

let cache = null;

async function getSettings(force = false) {
  if (cache && !force) return cache;
  let settings = await Settings.findOne({ key: "store" }).lean();
  if (!settings) {
    settings = { key: "store", ...DEFAULT_SETTINGS };
    await Settings.create(settings);
  }
  cache = settings;
  return settings;
}

async function updateSettings(data) {
  const allowed = [
    "storeName", "storeEmail", "supportPhone", "currency", "currencySymbol",
    "taxRate", "freeShippingThreshold", "defaultShippingRate",
    "lowStockThreshold", "maxOrderItems", "maintenanceMode",
  ];
  const update = {};
  allowed.forEach((k) => {
    if (data[k] !== undefined) update[k] = data[k];
  });

  let settings = await Settings.findOne({ key: "store" });
  if (!settings) {
    settings = await Settings.create({ key: "store", ...DEFAULT_SETTINGS, ...update });
  } else {
    Object.assign(settings, update);
    await settings.save();
  }
  cache = settings.toObject();
  return cache;
}

async function updateEmailTemplate(name, data) {
  const settings = await Settings.findOne({ key: "store" });
  if (!settings) throw new AppError("Store settings not found.", 404);
  if (!settings.emailTemplates) settings.emailTemplates = new Map();
  settings.emailTemplates.set(name, { subject: data.subject, body: data.body });
  await settings.save();
  cache = settings.toObject();
  return settings.emailTemplates;
}

export { getSettings, updateSettings, updateEmailTemplate };
