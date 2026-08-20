import Banner from "./banners.model.js";
import AppError from "../../utils/AppError.js";
import { getPagination, getPaginationMeta, getSort } from "../../utils/pagination.js";
import { deleteFromCloudinary } from "../../utils/cloudinary.js";

async function listActiveBanners(query = {}) {
  const filter = {
    active: true,
    $or: [{ startsAt: null }, { startsAt: { $lte: new Date() } }],
    $and: [{ $or: [{ endsAt: null }, { endsAt: { $gte: new Date() } }] }],
  };
  if (query.position) filter.position = query.position;
  return Banner.find(filter).sort({ createdAt: -1 }).lean();
}

async function listAllBanners(query) {
  const { page, limit, skip } = getPagination(query);
  const sort = getSort(query, ["createdAt", "title"]);

  const filter = {};
  if (query.position) filter.position = query.position;
  if (query.active === "true") filter.active = true;
  if (query.active === "false") filter.active = false;

  const [banners, total] = await Promise.all([
    Banner.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Banner.countDocuments(filter),
  ]);

  return {
    banners,
    meta: getPaginationMeta({ page, limit, total, totalPages: Math.ceil(total / limit) }),
  };
}

async function getBannerById(id) {
  const banner = await Banner.findById(id);
  if (!banner) throw new AppError("Banner not found.", 404);
  return banner;
}

async function createBanner(data) {
  return Banner.create(data);
}

async function updateBanner(id, data) {
  const banner = await Banner.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!banner) throw new AppError("Banner not found.", 404);
  return banner;
}

async function deleteBanner(id) {
  const banner = await Banner.findById(id);
  if (!banner) throw new AppError("Banner not found.", 404);
  if (banner.publicId) await deleteFromCloudinary(banner.publicId);
  await banner.deleteOne();
  return banner;
}

async function trackBanner(id, field) {
  return Banner.findByIdAndUpdate(id, { $inc: { [field]: 1 } }, { new: true });
}

export { listActiveBanners, listAllBanners, getBannerById, createBanner, updateBanner, deleteBanner, trackBanner };
