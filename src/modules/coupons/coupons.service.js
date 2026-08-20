import Coupon from "./coupons.model.js";
import AppError from "../../utils/AppError.js";
import { getPagination, getPaginationMeta, getSort } from "../../utils/pagination.js";

/**
 * Validate + compute the discount a coupon gives for a given subtotal.
 * Returns { coupon, discount }.
 */
async function validateCoupon(code, { subtotal, userId } = {}) {
  const coupon = await Coupon.findOne({ code: String(code || "").toUpperCase().trim() });
  if (!coupon) throw new AppError("Invalid coupon code.", 404);
  if (!coupon.active) throw new AppError("This coupon is no longer active.", 400);

  const now = Date.now();
  if (coupon.startsAt && now < new Date(coupon.startsAt).getTime()) {
    throw new AppError("This coupon is not yet valid.", 400);
  }
  if (coupon.expiresAt && now > new Date(coupon.expiresAt).getTime()) {
    throw new AppError("This coupon has expired.", 400);
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    throw new AppError("This coupon has reached its usage limit.", 400);
  }
  if (subtotal !== undefined && coupon.minSpend > 0 && subtotal < coupon.minSpend) {
    throw new AppError(`Minimum order value of ${coupon.minSpend} required for this coupon.`, 400);
  }
  if (userId) {
    const usage = coupon.usersUsed.find((u) => String(u.user) === String(userId));
    if (usage && usage.count >= coupon.perUserLimit) {
      throw new AppError("You have already used this coupon.", 400);
    }
  }

  let discount = 0;
  if (coupon.type === "fixed") {
    discount = Math.min(coupon.value, subtotal || coupon.value);
  } else {
    discount = ((subtotal || 0) * coupon.value) / 100;
    if (coupon.maxDiscount !== null) discount = Math.min(discount, coupon.maxDiscount);
  }
  discount = Math.round(discount * 100) / 100;

  return { coupon, discount };
}

/**
 * Record coupon usage (call after a successful order).
 */
async function recordUsage(couponId, userId) {
  const coupon = await Coupon.findById(couponId);
  if (!coupon) return;
  coupon.usedCount += 1;
  const entry = coupon.usersUsed.find((u) => String(u.user) === String(userId));
  if (entry) entry.count += 1;
  else coupon.usersUsed.push({ user: userId, count: 1 });
  await coupon.save();
}

async function listCoupons(query) {
  const { page, limit, skip } = getPagination(query);
  const sort = getSort(query, ["createdAt", "code", "value"]);

  const filter = {};
  if (query.search) filter.code = new RegExp(query.search.trim(), "i");
  if (query.active === "true") filter.active = true;
  if (query.active === "false") filter.active = false;
  if (query.type) filter.type = query.type;

  const [coupons, total] = await Promise.all([
    Coupon.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Coupon.countDocuments(filter),
  ]);

  return {
    coupons,
    meta: getPaginationMeta({ page, limit, total, totalPages: Math.ceil(total / limit) }),
  };
}

async function getCouponById(id) {
  const coupon = await Coupon.findById(id);
  if (!coupon) throw new AppError("Coupon not found.", 404);
  return coupon;
}

async function createCoupon(data) {
  const coupon = await Coupon.create({ ...data, code: String(data.code || "").toUpperCase().trim() });
  return coupon;
}

async function updateCoupon(id, data) {
  const coupon = await Coupon.findById(id);
  if (!coupon) throw new AppError("Coupon not found.", 404);
  if (data.code) data.code = String(data.code).toUpperCase().trim();
  const allowed = [
    "code", "type", "value", "minSpend", "maxDiscount", "maxUses",
    "perUserLimit", "applicableCategories", "applicableProducts",
    "expiresAt", "startsAt", "active",
  ];
  allowed.forEach((k) => {
    if (data[k] !== undefined) coupon[k] = data[k];
  });
  await coupon.save();
  return coupon;
}

async function deleteCoupon(id) {
  const coupon = await Coupon.findByIdAndDelete(id);
  if (!coupon) throw new AppError("Coupon not found.", 404);
  return coupon;
}

export {
  validateCoupon,
  recordUsage,
  listCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};
