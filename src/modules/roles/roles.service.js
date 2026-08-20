import Role from "./roles.model.js";
import AppError from "../../utils/AppError.js";
import { getPagination, getPaginationMeta } from "../../utils/pagination.js";

const modules = [
  "Dashboard", "Products", "Orders", "Customers", "Reviews", "Coupons",
  "Inventory", "Blog", "Reports", "Settings", "Vendors", "Media",
];
const perms = ["view", "create", "update", "delete"];

const defaultRoles = [
  { name: "Super Admin", key: "super_admin", description: "Unrestricted access to all modules and settings.", color: "primary", permissions: Object.fromEntries(modules.map((m) => [m, perms])), isSystem: true },
  { name: "Admin", key: "admin", description: "Full access except security & billing settings.", color: "accent", permissions: Object.fromEntries(modules.map((m) => [m, m === "Settings" ? ["view", "update"] : perms])), isSystem: true },
  { name: "Manager", key: "manager", description: "Manage catalog, orders, and customer support.", color: "info", permissions: Object.fromEntries(modules.map((m) => [m, ["view", m === "Orders" || m === "Products" ? "update" : ""].filter(Boolean)])), isSystem: true },
  { name: "Staff", key: "staff", description: "Process orders and answer support tickets.", color: "warning", permissions: Object.fromEntries(modules.map((m) => [m, m === "Orders" ? ["view", "update"] : ["view"]])), isSystem: true },
  { name: "Editor", key: "editor", description: "Manage blog, banners, and content.", color: "success", permissions: Object.fromEntries(modules.map((m) => [m, m === "Blog" ? perms : ["view"]])), isSystem: true },
  { name: "Customer", key: "customer", description: "Storefront shopper.", color: "secondary", permissions: {}, isSystem: true },
];

async function ensureDefaultRoles() {
  const count = await Role.countDocuments();
  if (count === 0) {
    await Role.insertMany(defaultRoles);
  }
}

async function listRoles(query) {
  const { page, limit, skip } = getPagination(query);
  const filter = {};
  if (query.search) filter.name = new RegExp(query.search.trim(), "i");

  const [roles, total] = await Promise.all([
    Role.find(filter).sort({ createdAt: 1 }).skip(skip).limit(limit).lean(),
    Role.countDocuments(filter),
  ]);

  return {
    roles,
    meta: getPaginationMeta({ page, limit, total, totalPages: Math.ceil(total / limit) }),
  };
}

async function getRoleById(id) {
  const role = await Role.findById(id);
  if (!role) throw new AppError("Role not found.", 404);
  return role;
}

async function createRole(data) {
  const role = await Role.create({
    ...data,
    key: data.key || data.name.toLowerCase().replace(/\s+/g, "_"),
    permissions: data.permissions || {},
  });
  return role;
}

async function updateRole(id, data) {
  const role = await Role.findById(id);
  if (!role) throw new AppError("Role not found.", 404);
  if (role.isSystem && data.key && data.key !== role.key) {
    throw new AppError("System roles cannot be re-keyed.", 400);
  }
  const allowed = ["name", "description", "color", "permissions", "members"];
  allowed.forEach((k) => {
    if (data[k] !== undefined) role[k] = data[k];
  });
  await role.save();
  return role;
}

async function deleteRole(id) {
  const role = await Role.findById(id);
  if (!role) throw new AppError("Role not found.", 404);
  if (role.isSystem) throw new AppError("System roles cannot be deleted.", 400);
  await role.deleteOne();
  return role;
}

export { ensureDefaultRoles, listRoles, getRoleById, createRole, updateRole, deleteRole };
