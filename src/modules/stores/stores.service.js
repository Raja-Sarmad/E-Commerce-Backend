import Store from "./stores.model.js";

async function listStores() {
  return Store.find({ isActive: true }).sort({ name: 1 }).lean();
}

export { listStores };
