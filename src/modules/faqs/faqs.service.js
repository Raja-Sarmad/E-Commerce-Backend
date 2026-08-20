import Faq from "./faqs.model.js";
import AppError from "../../utils/AppError.js";
import { getPagination, getPaginationMeta, getSort } from "../../utils/pagination.js";

async function listPublicFaqs(query) {
  const filter = { active: true };
  if (query.category) filter.category = query.category;
  return Faq.find(filter).sort({ category: 1, order: 1, createdAt: -1 }).lean();
}

async function listAllFaqs(query) {
  const { page, limit, skip } = getPagination(query);
  const sort = getSort(query, ["createdAt", "order"]);

  const filter = {};
  if (query.category) filter.category = query.category;
  if (query.search) filter.question = new RegExp(query.search.trim(), "i");

  const [faqs, total] = await Promise.all([
    Faq.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Faq.countDocuments(filter),
  ]);

  return {
    faqs,
    meta: getPaginationMeta({ page, limit, total, totalPages: Math.ceil(total / limit) }),
  };
}

async function getFaqById(id) {
  const faq = await Faq.findById(id);
  if (!faq) throw new AppError("FAQ not found.", 404);
  return faq;
}

async function createFaq(data) {
  return Faq.create(data);
}

async function updateFaq(id, data) {
  const faq = await Faq.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!faq) throw new AppError("FAQ not found.", 404);
  return faq;
}

async function deleteFaq(id) {
  const faq = await Faq.findByIdAndDelete(id);
  if (!faq) throw new AppError("FAQ not found.", 404);
  return faq;
}

async function listFaqCategories() {
  return Faq.distinct("category");
}

export { listPublicFaqs, listAllFaqs, getFaqById, createFaq, updateFaq, deleteFaq, listFaqCategories };
