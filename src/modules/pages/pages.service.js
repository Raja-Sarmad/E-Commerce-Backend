import Page from "./pages.model.js";
import AppError from "../../utils/AppError.js";
import { createSlug } from "../../utils/slugify.js";
import { getPagination, getPaginationMeta } from "../../utils/pagination.js";

async function getPublicPage(slug) {
  const page = await Page.findOne({ slug, published: true }).lean();
  if (!page) throw new AppError("Page not found.", 404);
  return page;
}

async function listAllPages(query) {
  const { page, limit, skip } = getPagination(query);
  const filter = {};
  if (query.search) filter.title = new RegExp(query.search.trim(), "i");

  const [pages, total] = await Promise.all([
    Page.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Page.countDocuments(filter),
  ]);

  return {
    pages,
    meta: getPaginationMeta({ page, limit, total, totalPages: Math.ceil(total / limit) }),
  };
}

async function getPageById(id) {
  const page = await Page.findById(id);
  if (!page) throw new AppError("Page not found.", 404);
  return page;
}

async function createPage(data) {
  const slug = data.slug || createSlug(data.title);
  return Page.create({ ...data, slug });
}

async function updatePage(id, data) {
  const page = await Page.findById(id);
  if (!page) throw new AppError("Page not found.", 404);
  if (data.slug) data.slug = createSlug(data.slug);
  const allowed = ["title", "slug", "content", "metaTitle", "metaDescription", "published"];
  allowed.forEach((k) => {
    if (data[k] !== undefined) page[k] = data[k];
  });
  await page.save();
  return page;
}

async function deletePage(id) {
  const page = await Page.findByIdAndDelete(id);
  if (!page) throw new AppError("Page not found.", 404);
  return page;
}

export { getPublicPage, listAllPages, getPageById, createPage, updatePage, deletePage };
