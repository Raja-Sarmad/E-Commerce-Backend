import Vendor from "./vendors.model.js";
import AppError from "../../utils/AppError.js";
import { getPagination, getPaginationMeta, getSort } from "../../utils/pagination.js";
import { createNotification } from "../notifications/notifications.service.js";

async function listVendors(query) {
  const { page, limit, skip } = getPagination(query);
  const sort = getSort(query, ["createdAt", "name", "rating"]);

  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.verified === "true") filter.verified = true;
  if (query.verified === "false") filter.verified = false;
  if (query.search) filter.name = new RegExp(query.search.trim(), "i");

  const [vendors, total] = await Promise.all([
    Vendor.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Vendor.countDocuments(filter),
  ]);

  return {
    vendors,
    meta: getPaginationMeta({ page, limit, total, totalPages: Math.ceil(total / limit) }),
  };
}

async function getVendorById(id) {
  const vendor = await Vendor.findById(id);
  if (!vendor) throw new AppError("Vendor not found.", 404);
  return vendor;
}

async function createVendor(data) {
  const vendor = await Vendor.create(data);
  await createNotification({
    type: "system",
    title: "New vendor application",
    message: `"${vendor.name}" applied to become a vendor.`,
    link: "/admin/vendors",
  });
  return vendor;
}

async function updateVendor(id, data) {
  const vendor = await Vendor.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!vendor) throw new AppError("Vendor not found.", 404);
  return vendor;
}

async function setVendorStatus(id, status) {
  const vendor = await Vendor.findByIdAndUpdate(id, { status }, { new: true });
  if (!vendor) throw new AppError("Vendor not found.", 404);
  await createNotification({
    type: "system",
    title: `Vendor ${status}`,
    message: `Vendor "${vendor.name}" status is now ${status}.`,
    link: "/admin/vendors",
  });
  return vendor;
}

async function deleteVendor(id) {
  const vendor = await Vendor.findByIdAndDelete(id);
  if (!vendor) throw new AppError("Vendor not found.", 404);
  return vendor;
}

export {
  listVendors,
  getVendorById,
  createVendor,
  updateVendor,
  setVendorStatus,
  deleteVendor,
};
