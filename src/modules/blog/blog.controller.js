import asyncHandler from "../../utils/asyncHandler.js";
import { sendResponse } from "../../utils/ApiResponse.js";
import * as blogService from "./blog.service.js";

const listPublicPosts = asyncHandler(async (req, res) => {
  const { posts, meta } = await blogService.listPublicPosts(req.query);
  return sendResponse(res, 200, "Posts fetched successfully.", posts, meta);
});

const getPublicPost = asyncHandler(async (req, res) => {
  const post = await blogService.getPublicPost(req.params.slug);
  return sendResponse(res, 200, "Post fetched successfully.", post);
});

const listAllPosts = asyncHandler(async (req, res) => {
  const { posts, meta } = await blogService.listAllPosts(req.query);
  return sendResponse(res, 200, "Posts fetched successfully.", posts, meta);
});

const getPostById = asyncHandler(async (req, res) => {
  const post = await blogService.getPostById(req.params.id);
  return sendResponse(res, 200, "Post fetched successfully.", post);
});

const createPost = asyncHandler(async (req, res) => {
  const post = await blogService.createPost({ ...req.body, authorRef: req.user?._id });
  return sendResponse(res, 201, "Post created successfully.", post);
});

const updatePost = asyncHandler(async (req, res) => {
  const post = await blogService.updatePost(req.params.id, req.body);
  return sendResponse(res, 200, "Post updated successfully.", post);
});

const deletePost = asyncHandler(async (req, res) => {
  await blogService.deletePost(req.params.id);
  return sendResponse(res, 200, "Post deleted successfully.");
});

export { listPublicPosts, getPublicPost, listAllPosts, getPostById, createPost, updatePost, deletePost };
