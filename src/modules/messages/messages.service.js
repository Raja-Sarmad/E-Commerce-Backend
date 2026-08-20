import Message from "./messages.model.js";
import AppError from "../../utils/AppError.js";
import { getPagination, getPaginationMeta, getSort } from "../../utils/pagination.js";
import { createNotification } from "../notifications/notifications.service.js";

async function createMessage(data) {
  const message = await Message.create(data);
  await createNotification({
    type: "customer",
    title: "New contact message",
    message: `${data.name} sent: "${data.subject}"`,
    link: "/admin/messages",
  });
  return message;
}

async function listMessages(query) {
  const { page, limit, skip } = getPagination(query);
  const sort = getSort(query, ["createdAt", "status"]);

  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.starred === "true") filter.starred = true;
  if (query.search) filter.$or = [{ name: new RegExp(query.search.trim(), "i") }, { email: new RegExp(query.search.trim(), "i") }, { subject: new RegExp(query.search.trim(), "i") }];

  const [messages, total] = await Promise.all([
    Message.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Message.countDocuments(filter),
  ]);

  return {
    messages,
    unreadCount: await Message.countDocuments({ status: "unread" }),
    meta: getPaginationMeta({ page, limit, total, totalPages: Math.ceil(total / limit) }),
  };
}

async function getMessage(id) {
  const message = await Message.findById(id);
  if (!message) throw new AppError("Message not found.", 404);
  if (message.status === "unread") {
    message.status = "read";
    await message.save();
  }
  return message;
}

async function updateMessage(id, data) {
  const message = await Message.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!message) throw new AppError("Message not found.", 404);
  return message;
}

async function deleteMessage(id) {
  const message = await Message.findByIdAndDelete(id);
  if (!message) throw new AppError("Message not found.", 404);
  return message;
}

export { createMessage, listMessages, getMessage, updateMessage, deleteMessage };
