import asyncHandler from "../../utils/asyncHandler.js";
import { sendResponse } from "../../utils/ApiResponse.js";
import * as newsletterService from "./newsletter.service.js";

const subscribe = asyncHandler(async (req, res) => {
  const { subscriber, alreadySubscribed } = await newsletterService.subscribe(req.body);
  return sendResponse(
    res,
    alreadySubscribed ? 200 : 201,
    alreadySubscribed ? "You are already subscribed." : "Subscribed successfully.",
    subscriber
  );
});

const unsubscribe = asyncHandler(async (req, res) => {
  const subscriber = await newsletterService.unsubscribe(req.params.email);
  return sendResponse(res, 200, "Unsubscribed successfully.", subscriber);
});

const listSubscribers = asyncHandler(async (req, res) => {
  const { subscribers, meta } = await newsletterService.listSubscribers(req.query);
  return sendResponse(res, 200, "Subscribers fetched successfully.", subscribers, meta);
});

const getSubscriber = asyncHandler(async (req, res) => {
  const subscriber = await newsletterService.getSubscriber(req.params.id);
  return sendResponse(res, 200, "Subscriber fetched successfully.", subscriber);
});

const deleteSubscriber = asyncHandler(async (req, res) => {
  await newsletterService.deleteSubscriber(req.params.id);
  return sendResponse(res, 200, "Subscriber deleted successfully.");
});

export { subscribe, unsubscribe, listSubscribers, getSubscriber, deleteSubscriber };
