import Subscriber from "./newsletter.model.js";
import AppError from "../../utils/AppError.js";
import { getPagination, getPaginationMeta, getSort } from "../../utils/pagination.js";

async function subscribe({ email, name, source }) {
  const normalized = email.toLowerCase().trim();
  let subscriber = await Subscriber.findOne({ email: normalized });

  if (subscriber) {
    if (subscriber.status === "unsubscribed") {
      subscriber.status = "active";
      subscriber.name = name || subscriber.name;
      await subscriber.save();
    }
    return { subscriber, alreadySubscribed: true };
  }

  subscriber = await Subscriber.create({ email: normalized, name, source });
  return { subscriber, alreadySubscribed: false };
}

async function unsubscribe(email) {
  const normalized = email.toLowerCase().trim();
  const subscriber = await Subscriber.findOneAndUpdate(
    { email: normalized },
    { status: "unsubscribed" },
    { new: true }
  );
  if (!subscriber) throw new AppError("Subscriber not found.", 404);
  return subscriber;
}

async function listSubscribers(query) {
  const { page, limit, skip } = getPagination(query);
  const sort = getSort(query, ["createdAt", "email"]);

  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.search) filter.$or = [{ email: new RegExp(query.search.trim(), "i") }, { name: new RegExp(query.search.trim(), "i") }];

  const [subscribers, total] = await Promise.all([
    Subscriber.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Subscriber.countDocuments(filter),
  ]);

  return {
    subscribers,
    meta: getPaginationMeta({ page, limit, total, totalPages: Math.ceil(total / limit) }),
  };
}

async function getSubscriber(id) {
  const subscriber = await Subscriber.findById(id);
  if (!subscriber) throw new AppError("Subscriber not found.", 404);
  return subscriber;
}

async function deleteSubscriber(id) {
  const subscriber = await Subscriber.findByIdAndDelete(id);
  if (!subscriber) throw new AppError("Subscriber not found.", 404);
  return subscriber;
}

export { subscribe, unsubscribe, listSubscribers, getSubscriber, deleteSubscriber };
