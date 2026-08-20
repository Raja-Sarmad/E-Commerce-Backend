import BlogPost from "./blog.model.js";
import AppError from "../../utils/AppError.js";
import { createSlug } from "../../utils/slugify.js";
import { getPagination, getPaginationMeta, getSort } from "../../utils/pagination.js";
import { deleteFromCloudinary } from "../../utils/cloudinary.js";

async function listPublicPosts(query) {
  const { page, limit, skip } = getPagination(query);
  const sort = getSort(query, ["createdAt", "views", "title"]);

  const filter = { status: "published" };
  if (query.category) filter.category = query.category;
  if (query.search) filter.$or = [{ title: new RegExp(query.search.trim(), "i") }, { excerpt: new RegExp(query.search.trim(), "i") }];
  if (query.tag) filter.tags = query.tag;
  if (query.featured === "true") filter.featured = true;

  const [posts, total] = await Promise.all([
    BlogPost.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    BlogPost.countDocuments(filter),
  ]);

  return {
    posts,
    meta: getPaginationMeta({ page, limit, total, totalPages: Math.ceil(total / limit) }),
  };
}

async function getPublicPost(slug) {
  const post = await BlogPost.findOneAndUpdate(
    { slug, status: "published" },
    { $inc: { views: 1 } },
    { new: true }
  );
  if (!post) throw new AppError("Post not found.", 404);
  return post;
}

async function listAllPosts(query) {
  const { page, limit, skip } = getPagination(query);
  const sort = getSort(query, ["createdAt", "views", "title"]);

  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;
  if (query.search) filter.title = new RegExp(query.search.trim(), "i");

  const [posts, total] = await Promise.all([
    BlogPost.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    BlogPost.countDocuments(filter),
  ]);

  return {
    posts,
    meta: getPaginationMeta({ page, limit, total, totalPages: Math.ceil(total / limit) }),
  };
}

async function getPostById(id) {
  const post = await BlogPost.findById(id);
  if (!post) throw new AppError("Post not found.", 404);
  return post;
}

async function createPost(data) {
  const slug = data.slug || createSlug(data.title);
  const content = Array.isArray(data.content)
    ? data.content.join("\n\n")
    : data.content || "";
  const readTime =
    data.readTime || Math.max(1, Math.ceil(content.split(/\s+/).filter(Boolean).length / 200));
  return BlogPost.create({ ...data, slug, content, readTime });
}

async function updatePost(id, data) {
  const post = await BlogPost.findById(id);
  if (!post) throw new AppError("Post not found.", 404);
  if (data.slug) data.slug = createSlug(data.slug);
  if (Array.isArray(data.content)) data.content = data.content.join("\n\n");
  if (data.readTime === undefined && typeof data.content === "string") {
    data.readTime = Math.max(1, Math.ceil(data.content.split(/\s+/).filter(Boolean).length / 200));
  }
  const allowed = [
    "title", "slug", "excerpt", "content", "coverImage", "publicId",
    "category", "author", "authorAvatar", "authorRef", "readTime",
    "tags", "featured", "status", "scheduledAt",
  ];
  allowed.forEach((k) => {
    if (data[k] !== undefined) post[k] = data[k];
  });
  await post.save();
  return post;
}

async function deletePost(id) {
  const post = await BlogPost.findById(id);
  if (!post) throw new AppError("Post not found.", 404);
  if (post.publicId) await deleteFromCloudinary(post.publicId);
  await post.deleteOne();
  return post;
}

export { listPublicPosts, getPublicPost, listAllPosts, getPostById, createPost, updatePost, deletePost };
