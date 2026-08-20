import asyncHandler from "../../utils/asyncHandler.js";
import { sendResponse } from "../../utils/ApiResponse.js";
import * as notificationService from "./notifications.service.js";

const listAdminNotifications = asyncHandler(async (req, res) => {
  const { notifications, unreadCount, meta } = await notificationService.listNotifications(
    req.query,
    { admin: true }
  );
  return sendResponse(res, 200, "Notifications fetched successfully.", { notifications, unreadCount }, meta);
});

const listMyNotifications = asyncHandler(async (req, res) => {
  const { notifications, unreadCount, meta } = await notificationService.listNotifications(
    req.query,
    { admin: false, userId: req.user._id }
  );
  return sendResponse(res, 200, "Notifications fetched successfully.", { notifications, unreadCount }, meta);
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(req.params.id);
  return sendResponse(res, 200, "Notification marked as read.", notification);
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead();
  return sendResponse(res, 200, "All notifications marked as read.");
});

const deleteNotification = asyncHandler(async (req, res) => {
  await notificationService.deleteNotification(req.params.id);
  return sendResponse(res, 200, "Notification deleted.");
});

export {
  listAdminNotifications,
  listMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
