import asyncHandler from "../../utils/asyncHandler.js";
import { sendResponse } from "../../utils/ApiResponse.js";
import * as messageService from "./messages.service.js";

const createMessage = asyncHandler(async (req, res) => {
  const message = await messageService.createMessage(req.body);
  return sendResponse(res, 201, "Message sent successfully. We'll get back to you soon.", message);
});

const listMessages = asyncHandler(async (req, res) => {
  const { messages, unreadCount, meta } = await messageService.listMessages(req.query);
  return sendResponse(res, 200, "Messages fetched successfully.", messages, { ...meta, unreadCount });
});

const getMessage = asyncHandler(async (req, res) => {
  const message = await messageService.getMessage(req.params.id);
  return sendResponse(res, 200, "Message fetched successfully.", message);
});

const updateMessage = asyncHandler(async (req, res) => {
  const message = await messageService.updateMessage(req.params.id, req.body);
  return sendResponse(res, 200, "Message updated successfully.", message);
});

const deleteMessage = asyncHandler(async (req, res) => {
  await messageService.deleteMessage(req.params.id);
  return sendResponse(res, 200, "Message deleted successfully.");
});

export { createMessage, listMessages, getMessage, updateMessage, deleteMessage };
