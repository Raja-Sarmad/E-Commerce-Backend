import Wishlist from "./wishlist.model.js";
import Product from "../products/products.model.js";
import AppError from "../../utils/AppError.js";

async function getOrCreateWishlist(userId) {
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, products: [] });
  }
  return wishlist;
}

async function getWishlist(userId) {
  const wishlist = await Wishlist.findOne({ user: userId })
    .populate("products.product")
    .lean();
  return wishlist
    ? wishlist.products.filter((p) => p.product).map((p) => ({ product: p.product, addedAt: p.addedAt }))
    : [];
}

async function addProduct(userId, productId) {
  const product = await Product.findById(productId);
  if (!product) throw new AppError("Product not found.", 404);

  const wishlist = await getOrCreateWishlist(userId);
  if (!wishlist.products.some((p) => String(p.product) === String(productId))) {
    wishlist.products.push({ product: productId });
    await wishlist.save();
  }
  return wishlist;
}

async function removeProduct(userId, productId) {
  const wishlist = await getOrCreateWishlist(userId);
  wishlist.products = wishlist.products.filter(
    (p) => String(p.product) !== String(productId)
  );
  await wishlist.save();
  return wishlist;
}

async function clearWishlist(userId) {
  const wishlist = await getOrCreateWishlist(userId);
  wishlist.products = [];
  await wishlist.save();
  return wishlist;
}

async function toggleProduct(userId, productId) {
  const wishlist = await getOrCreateWishlist(userId);
  const exists = wishlist.products.some((p) => String(p.product) === String(productId));
  if (exists) {
    wishlist.products = wishlist.products.filter(
      (p) => String(p.product) !== String(productId)
    );
  } else {
    wishlist.products.push({ product: productId });
  }
  await wishlist.save();
  return { wishlist, inWishlist: !exists };
}

export { getWishlist, addProduct, removeProduct, clearWishlist, toggleProduct };
