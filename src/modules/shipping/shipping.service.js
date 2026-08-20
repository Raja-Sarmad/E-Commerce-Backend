import { ShippingZone, ShippingMethod } from "./shipping.model.js";
import AppError from "../../utils/AppError.js";

async function listZones(query = {}) {
  const filter = {};
  if (query.active === "true") filter.active = true;
  if (query.active === "false") filter.active = false;
  return ShippingZone.find(filter).sort({ name: 1 }).lean();
}

async function getZone(id) {
  const zone = await ShippingZone.findById(id);
  if (!zone) throw new AppError("Shipping zone not found.", 404);
  return zone;
}

async function createZone(data) {
  return ShippingZone.create(data);
}

async function updateZone(id, data) {
  const zone = await ShippingZone.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!zone) throw new AppError("Shipping zone not found.", 404);
  return zone;
}

async function deleteZone(id) {
  const zone = await ShippingZone.findByIdAndDelete(id);
  if (!zone) throw new AppError("Shipping zone not found.", 404);
  await ShippingMethod.deleteMany({ zoneRef: id });
  return zone;
}

async function listMethods(query = {}) {
  const filter = {};
  if (query.active === "true") filter.active = true;
  if (query.active === "false") filter.active = false;
  if (query.zone) filter.zone = query.zone;
  return ShippingMethod.find(filter).sort({ name: 1 }).lean();
}

async function getMethod(id) {
  const method = await ShippingMethod.findById(id);
  if (!method) throw new AppError("Shipping method not found.", 404);
  return method;
}

async function createMethod(data) {
  return ShippingMethod.create(data);
}

async function updateMethod(id, data) {
  const method = await ShippingMethod.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!method) throw new AppError("Shipping method not found.", 404);
  return method;
}

async function deleteMethod(id) {
  const method = await ShippingMethod.findByIdAndDelete(id);
  if (!method) throw new AppError("Shipping method not found.", 404);
  return method;
}

export {
  listZones,
  getZone,
  createZone,
  updateZone,
  deleteZone,
  listMethods,
  getMethod,
  createMethod,
  updateMethod,
  deleteMethod,
};
