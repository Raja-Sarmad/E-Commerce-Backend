import LogEntry from "./logs.model.js";
import { getPagination, getPaginationMeta, getSort } from "../../utils/pagination.js";

/**
 * Write a log entry. Fire-and-forget (never throws).
 */
async function logActivity({ type, user, action, details, ip, level, metadata }) {
  try {
    await LogEntry.create({ type, user, action, details, ip, level, metadata });
  } catch (err) {
    console.error("[logs] Failed to write log:", err.message);
  }
}

async function listLogs(query) {
  const { page, limit, skip } = getPagination(query);
  const sort = getSort(query, ["createdAt", "level"]);

  const filter = {};
  if (query.type) filter.type = query.type;
  if (query.level) filter.level = query.level;
  if (query.search) filter.$or = [{ user: new RegExp(query.search.trim(), "i") }, { action: new RegExp(query.search.trim(), "i") }];

  const [logs, total] = await Promise.all([
    LogEntry.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    LogEntry.countDocuments(filter),
  ]);

  return {
    logs,
    meta: getPaginationMeta({ page, limit, total, totalPages: Math.ceil(total / limit) }),
  };
}

async function clearLogs() {
  await LogEntry.deleteMany({});
}

export { logActivity, listLogs, clearLogs };
