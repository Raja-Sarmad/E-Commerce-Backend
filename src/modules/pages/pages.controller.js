import asyncHandler from "../../utils/asyncHandler.js";
import { sendResponse } from "../../utils/ApiResponse.js";
import * as pageService from "./pages.service.js";

const getPublicPage = asyncHandler(async (req, res) => {
  const page = await pageService.getPublicPage(req.params.slug);
  return sendResponse(res, 200, "Page fetched successfully.", page);
});

const listAllPages = asyncHandler(async (req, res) => {
  const { pages, meta } = await pageService.listAllPages(req.query);
  return sendResponse(res, 200, "Pages fetched successfully.", pages, meta);
});

const getPageById = asyncHandler(async (req, res) => {
  const page = await pageService.getPageById(req.params.id);
  return sendResponse(res, 200, "Page fetched successfully.", page);
});

const createPage = asyncHandler(async (req, res) => {
  const page = await pageService.createPage(req.body);
  return sendResponse(res, 201, "Page created successfully.", page);
});

const updatePage = asyncHandler(async (req, res) => {
  const page = await pageService.updatePage(req.params.id, req.body);
  return sendResponse(res, 200, "Page updated successfully.", page);
});

const deletePage = asyncHandler(async (req, res) => {
  await pageService.deletePage(req.params.id);
  return sendResponse(res, 200, "Page deleted successfully.");
});

export { getPublicPage, listAllPages, getPageById, createPage, updatePage, deletePage };
