import User from "./users.model.js";
import AppError from "../../utils/AppError.js";
import { getPagination, getPaginationMeta, getSort } from "../../utils/pagination.js";

/**
 * All user service functions return plain data; controllers handle HTTP.
 */

async function getProfile(userId) {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found.", 404);
  return user.toPublicJSON();
}

async function updateProfile(userId, data) {
  const allowed = ["name", "phone", "avatar", "address"];
  const update = {};
  allowed.forEach((k) => {
    if (data[k] !== undefined) update[k] = data[k];
  });
  if (update.address) update.address = { ...update.address };

  const user = await User.findByIdAndUpdate(userId, update, {
    new: true,
    runValidators: true,
  });
  if (!user) throw new AppError("User not found.", 404);
  return user.toPublicJSON();
}

async function updatePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select("+password");
  if (!user) throw new AppError("User not found.", 404);

  const match = await user.comparePassword(currentPassword);
  if (!match) throw new AppError("Current password is incorrect.", 400);

  if (currentPassword === newPassword) {
    throw new AppError("New password must be different from the current password.", 400);
  }

  user.password = newPassword;
  await user.save();
  return user.toPublicJSON();
}

async function listUsers(query, filters = {}) {
  const { page, limit, skip } = getPagination(query);
  const sort = getSort(query, ["createdAt", "name", "role", "totalSpent"]);

  const filter = { ...filters };

  if (query.search) {
    const re = new RegExp(query.search.trim(), "i");
    filter.$or = [{ name: re }, { email: re }];
  }
  if (query.role) filter.role = query.role;
  if (query.tier) filter.tier = query.tier;
  if (query.status === "blocked") filter.isBlocked = true;
  if (query.status === "active") filter.isBlocked = false;

  const [users, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  return {
    users,
    meta: getPaginationMeta({ page, limit, total, totalPages: Math.ceil(total / limit) }),
  };
}

async function getUserById(userId) {
  const user = await User.findById(userId).lean();
  if (!user) throw new AppError("User not found.", 404);
  return user;
}

async function updateUserByAdmin(userId, data) {
  const allowed = ["name", "email", "phone", "role", "tier", "isBlocked", "isEmailVerified", "loyaltyPoints", "avatar"];
  const update = {};
  allowed.forEach((k) => {
    if (data[k] !== undefined) update[k] = data[k];
  });

  const user = await User.findByIdAndUpdate(userId, update, {
    new: true,
    runValidators: true,
  });
  if (!user) throw new AppError("User not found.", 404);
  return user.toPublicJSON();
}

async function deleteUser(userId) {
  const user = await User.findByIdAndDelete(userId);
  if (!user) throw new AppError("User not found.", 404);
  return user.toPublicJSON();
}

async function blockUser(userId, block = true) {
  const user = await User.findByIdAndUpdate(
    userId,
    { isBlocked: block, blockedAt: block ? new Date() : null },
    { new: true }
  );
  if (!user) throw new AppError("User not found.", 404);
  return user.toPublicJSON();
}

export {
  getProfile,
  updateProfile,
  updatePassword,
  listUsers,
  getUserById,
  updateUserByAdmin,
  deleteUser,
  blockUser,
};
