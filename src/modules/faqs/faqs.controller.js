import asyncHandler from "../../utils/asyncHandler.js";
import { sendResponse } from "../../utils/ApiResponse.js";
import * as faqService from "./faqs.service.js";

const listPublicFaqs = asyncHandler(async (req, res) => {
  const faqs = await faqService.listPublicFaqs(req.query);
  return sendResponse(res, 200, "FAQs fetched successfully.", faqs);
});

const listAllFaqs = asyncHandler(async (req, res) => {
  const { faqs, meta } = await faqService.listAllFaqs(req.query);
  return sendResponse(res, 200, "FAQs fetched successfully.", faqs, meta);
});

const getFaqById = asyncHandler(async (req, res) => {
  const faq = await faqService.getFaqById(req.params.id);
  return sendResponse(res, 200, "FAQ fetched successfully.", faq);
});

const createFaq = asyncHandler(async (req, res) => {
  const faq = await faqService.createFaq(req.body);
  return sendResponse(res, 201, "FAQ created successfully.", faq);
});

const updateFaq = asyncHandler(async (req, res) => {
  const faq = await faqService.updateFaq(req.params.id, req.body);
  return sendResponse(res, 200, "FAQ updated successfully.", faq);
});

const deleteFaq = asyncHandler(async (req, res) => {
  await faqService.deleteFaq(req.params.id);
  return sendResponse(res, 200, "FAQ deleted successfully.");
});

const listFaqCategories = asyncHandler(async (_req, res) => {
  const categories = await faqService.listFaqCategories();
  return sendResponse(res, 200, "FAQ categories fetched successfully.", categories);
});

export { listPublicFaqs, listAllFaqs, getFaqById, createFaq, updateFaq, deleteFaq, listFaqCategories };
