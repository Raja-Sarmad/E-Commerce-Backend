/**
 * NovaMart Seed Script
 *
 * Creates:
 *  - Default admin user (from .env, safe to re-run)
 *  - Sample categories, brands, products, coupons, FAQ, blog posts, banners
 *
 * Usage:
 *   npm run seed              -> seed defaults + sample data
 *   npm run seed -- --demo    -> also insert demo customers & orders
 *   npm run seed -- --destroy -> wipe ALL collections first (danger)
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import config from "../config/index.js";
import User from "../modules/users/users.model.js";
import Product from "../modules/products/products.model.js";
import Category from "../modules/categories/categories.model.js";
import Brand from "../modules/brands/brands.model.js";
import Coupon from "../modules/coupons/coupons.model.js";
import Faq from "../modules/faqs/faqs.model.js";
import BlogPost from "../modules/blog/blog.model.js";
import Banner from "../modules/banners/banners.model.js";
import Order from "../modules/orders/orders.model.js";
import { ROLES } from "../constants/index.js";
import { ensureDefaultPaymentMethods } from "./bootstrap.js";
import { createSlug } from "../utils/slugify.js";

const DESTROY = process.argv.includes("--destroy");
const WITH_DEMO = process.argv.includes("--demo");

/* ── Sample data ────────────────────────────────────────────── */

const categorySeeds = [
  { name: "Electronics", description: "Audio, wearables & smart devices", icon: "FiMonitor", featured: true },
  { name: "Fashion", description: "Apparel, footwear & accessories", icon: "FiShoppingBag", featured: true },
  { name: "Home & Living", description: "Furniture, decor & essentials", icon: "FiHome", featured: true },
  { name: "Beauty & Care", description: "Skincare, cosmetics & wellness", icon: "FiHeart", featured: false },
  { name: "Sports & Outdoors", description: "Fitness gear & outdoor equipment", icon: "FiActivity", featured: false },
  { name: "Toys & Kids", description: "Toys, games & children's items", icon: "FiSmile", featured: false },
];

const brandSeeds = [
  { name: "Sonix", description: "Premium audio equipment." },
  { name: "TechOne", description: "Smart gadgets and wearables." },
  { name: "Lumen Home", description: "Modern home & living essentials." },
  { name: "PureSkin", description: "Clean beauty and skincare products." },
  { name: "Vertex Sports", description: "Performance sports & outdoors gear." },
];

const productSeeds = [
  {
    name: "Aurora Wireless Headphones Pro",
    brand: "Sonix", category: "Electronics", categorySlug: "electronics",
    description: "Studio-quality sound with active noise cancellation, adaptive EQ and a 40-hour battery life.",
    features: ["Active Noise Cancellation", "40-hour battery life", "Bluetooth 5.4", "Spatial audio"],
    specifications: { Driver: "40mm dynamic", "Battery Life": "40 hours", Connectivity: "Bluetooth 5.4" },
    price: 199, compareAtPrice: 249, stock: 46, sku: "SNX-HDP-001",
    tags: ["wireless", "audio", "noise-cancelling"], isFeatured: true, isBestSeller: true, isTrending: true, onSale: true,
    colors: ["#1e293b", "#f8fafc"], rating: 4.8, reviewsCount: 1284,
    images: ["https://picsum.photos/seed/aurora/700/700"],
  },
  {
    name: "Pulse Fit Smartwatch",
    brand: "TechOne", category: "Electronics", categorySlug: "electronics",
    description: "Track every heartbeat, step and sleep cycle with a vivid AMOLED display and 7-day battery.",
    features: ["1.4-inch AMOLED display", "Built-in GPS", "100+ workout modes", "5ATM water resistance"],
    specifications: { Display: "1.4-inch AMOLED", "Battery Life": "7 days", "Water Resistance": "5ATM" },
    price: 149, compareAtPrice: 199, stock: 38, sku: "TCH-SMR-002",
    tags: ["smartwatch", "fitness", "wearable"], isFeatured: true, isBestSeller: true, isTrending: true, onSale: true,
    colors: ["#1e293b", "#a855f7"], rating: 4.6, reviewsCount: 892,
    images: ["https://picsum.photos/seed/pulse/700/700"],
  },
  {
    name: "Cloud Drift Mattress Topper",
    brand: "Lumen Home", category: "Home & Living", categorySlug: "home-living",
    description: "Five inches of cooling gel memory foam for a hotel-soft night's sleep.",
    features: ["Cooling gel infusion", "5-inch profile", "Machine washable cover"],
    specifications: { Size: "Queen", Profile: "5 inches", Material: "Memory foam" },
    price: 129, stock: 12, sku: "LMN-MTT-003",
    tags: ["bedding", "sleep", "home"], isFeatured: true, colors: ["#f8fafc"],
    rating: 4.5, reviewsCount: 341,
    images: ["https://picsum.photos/seed/drift/700/700"],
  },
  {
    name: "Glow Ritual Serum Set",
    brand: "PureSkin", category: "Beauty & Care", categorySlug: "beauty-care",
    description: "A three-step vitamin C ritual for brighter, smoother skin.",
    features: ["Vitamin C serum", "Hyaluronic acid", "Niacinamide"],
    specifications: { Volume: "3 x 30ml", Skin: "All types" },
    price: 89, compareAtPrice: 109, stock: 50, sku: "PSK-SRM-004",
    tags: ["skincare", "beauty", "serum"], isBestSeller: true, onSale: true,
    colors: [], rating: 4.7, reviewsCount: 421,
    images: ["https://picsum.photos/seed/glow/700/700"],
  },
  {
    name: "Trail Blaze Running Shoes",
    brand: "Vertex Sports", category: "Sports & Outdoors", categorySlug: "sports-outdoors",
    description: "Lightweight trail runners with responsive cushioning and aggressive grip.",
    features: ["Breathable mesh", "Responsive foam", "Trail-grip outsole"],
    specifications: { Type: "Trail running", Weight: "255g" },
    price: 119, stock: 18, sku: "VTX-SHO-005",
    tags: ["running", "shoes", "sports"], isNew: true,
    sizes: ["7", "8", "9", "10", "11"], colors: ["#ef4444", "#1e293b"],
    rating: 4.4, reviewsCount: 96,
    images: ["https://picsum.photos/seed/trail/700/700"],
  },
  {
    name: "Smart Home Starter Kit",
    brand: "TechOne", category: "Electronics", categorySlug: "electronics",
    description: "Hub, two smart bulbs and a motion sensor to kick-start your smart home.",
    features: ["Voice control", "App scheduling", "Energy monitoring"],
    specifications: { Hub: "Zigbee/Wi-Fi", Bulbs: "2 x 9W" },
    price: 149, stock: 8, sku: "TCH-HME-006",
    tags: ["smart-home", "iot"], isTrending: true,
    colors: ["#f8fafc"], rating: 4.3, reviewsCount: 210,
    images: ["https://picsum.photos/seed/smarthome/700/700"],
  },
];

const couponSeeds = [
  { code: "WELCOME10", type: "percentage", value: 10, minSpend: 50, maxUses: 1000, perUserLimit: 1, active: true },
  { code: "SAVE20", type: "percentage", value: 20, minSpend: 150, maxUses: 500, active: true },
  { code: "FLAT25", type: "fixed", value: 25, minSpend: 120, maxUses: 300, active: true },
  { code: "FREESHIP", type: "percentage", value: 0, minSpend: 100, maxUses: 2000, active: true },
];

const faqSeeds = [
  { category: "Orders & Shipping", question: "How long does shipping take?", answer: "Standard shipping takes 2-4 business days for most orders.", order: 1, active: true },
  { category: "Orders & Shipping", question: "How much does shipping cost?", answer: "Shipping is free on orders over $100. Otherwise a flat rate of $12 applies.", order: 2, active: true },
  { category: "Returns & Refunds", question: "What is your return policy?", answer: "We offer a 30-day return window on most items in original condition.", order: 1, active: true },
  { category: "Returns & Refunds", question: "When will I get my refund?", answer: "Refunds are processed within 2-3 business days of receiving the return.", order: 2, active: true },
  { category: "Payments", question: "What payment methods do you accept?", answer: "All major cards, PayPal, Apple Pay, Google Pay, and cash on delivery.", order: 1, active: true },
  { category: "Payments", question: "Is it safe to shop on NovaMart?", answer: "Yes. Checkout is secured with 256-bit encryption.", order: 2, active: true },
];

const blogSeeds = [
  {
    title: "How to Choose the Perfect Wireless Headphones in 2026",
    excerpt: "From noise cancellation to battery life, here's everything you need to know before buying your next pair of headphones.",
    content: ["Wireless headphones have come a long way.", "Battery life matters more than most people think.", "Sound quality is subjective."],
    category: "Buying Guides", author: "NovaMart Editorial",
    tags: ["audio", "headphones"], featured: true, status: "published", views: 12480,
    coverImage: "https://picsum.photos/seed/blog-1/900/520",
  },
  {
    title: "Skincare Routine 101: Build Your Routine in 5 Steps",
    excerpt: "Cleanser, serum, moisturizer, SPF — demystify the modern skincare routine with this beginner-friendly guide.",
    content: ["A great skincare routine doesn't need ten products.", "Step one is cleansing.", "Step four is SPF."],
    category: "Beauty & Care", author: "NovaMart Editorial",
    tags: ["skincare", "beauty"], featured: true, status: "published", views: 9804,
    coverImage: "https://picsum.photos/seed/blog-2/900/520",
  },
  {
    title: "Smart Home Essentials for Every Budget",
    excerpt: "Build a smart home without breaking the bank. Our editors pick the best-value devices.",
    content: ["Smart home tech is more affordable than ever.", "Start with a smart speaker.", "Automate your lighting."],
    category: "Home & Living", author: "NovaMart Editorial",
    tags: ["smart-home", "tech"], status: "draft", views: 0,
    coverImage: "https://picsum.photos/seed/blog-3/900/520",
  },
];

const bannerSeeds = [
  { title: "Summer Tech Sale", position: "hero", image: "https://picsum.photos/seed/bn-hero/1200/500", link: "/shop?category=electronics", active: true, views: 28400, clicks: 3410 },
  { title: "Free Shipping Over $100", position: "promo", image: "https://picsum.photos/seed/bn-promo/800/400", link: "/shop", active: true, views: 19200, clicks: 1022 },
  { title: "Home Refresh Collection", position: "homepage", image: "https://picsum.photos/seed/bn-home/900/400", link: "/shop?category=home-living", active: true, views: 15400, clicks: 876 },
];

/* ── Seeding logic ──────────────────────────────────────────── */

async function seedAdmin() {
  let admin = await User.findOne({ email: config.seed.adminEmail });
  const isHashed = /^\$2[aby]\$/.test(admin?.password ?? "");
  const matches = isHashed
    ? await bcrypt.compare(config.seed.adminPassword, admin.password)
    : false;

  const password = matches ? admin.password : await bcrypt.hash(config.seed.adminPassword, 10);

  admin = await User.findOneAndUpdate(
    { email: config.seed.adminEmail },
    {
      $set: { password },
      $setOnInsert: {
        name: config.seed.adminName,
        email: config.seed.adminEmail,
        phone: config.seed.adminPhone,
        role: ROLES.SUPER_ADMIN,
        isEmailVerified: true,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log(`[seed] Admin ready: ${admin.email} (role: ${admin.role})`);
  return admin;
}

async function seedCatalog() {
  const categories = await Category.insertMany(
    categorySeeds.map((c) => ({ ...c, slug: createSlug(c.name) })),
    { ordered: false }
  ).catch((err) => (err.code === 11000 ? Category.find() : Promise.reject(err)));
  console.log(`[seed] Categories: ${categories.length}`);

  await Brand.insertMany(
    brandSeeds.map((b) => ({ ...b, slug: createSlug(b.name) })),
    { ordered: false }
  ).catch((err) => (err.code === 11000 ? null : Promise.reject(err)));

  await Product.insertMany(
    productSeeds.map((p) => ({ ...p, slug: createSlug(p.name) })),
    { ordered: false }
  ).catch((err) => (err.code === 11000 ? null : Promise.reject(err)));
  console.log(`[seed] Products: ${productSeeds.length}`);
}

async function seedContent() {
  await Coupon.insertMany(couponSeeds, { ordered: false })
    .catch((err) => (err.code === 11000 ? null : Promise.reject(err)));
  await Faq.insertMany(faqSeeds, { ordered: false })
    .catch((err) => (err.code === 11000 ? null : Promise.reject(err)));
  await BlogPost.insertMany(
    blogSeeds.map((b) => ({ ...b, slug: createSlug(b.title) })),
    { ordered: false }
  ).catch((err) => (err.code === 11000 ? null : Promise.reject(err)));
  await Banner.insertMany(bannerSeeds, { ordered: false })
    .catch((err) => (err.code === 11000 ? null : Promise.reject(err)));
  console.log("[seed] Content seeded: coupons, FAQs, blog posts, banners");
}

async function seedDemoCustomersAndOrders() {
  const customers = await User.insertMany([
    { name: "Rachel Greene", email: "rachel@example.com", password: "Customer@123", role: ROLES.CUSTOMER, isEmailVerified: true },
    { name: "James Carter", email: "james@example.com", password: "Customer@123", role: ROLES.CUSTOMER, isEmailVerified: true },
    { name: "Sofia Marchetti", email: "sofia@example.com", password: "Customer@123", role: ROLES.CUSTOMER, isEmailVerified: true },
  ]).catch((err) => (err.code === 11000 ? User.find({ role: ROLES.CUSTOMER }).limit(3) : Promise.reject(err)));

  const products = await Product.find().limit(3);
  if (customers.length && products.length) {
    const now = Date.now();
    const orders = customers.flatMap((c, i) =>
      products.map((p, j) => ({
        user: c._id,
        items: [{ productId: p._id, name: p.name, image: p.images[0] || "", price: p.price, quantity: (j % 2) + 1 }],
        subtotal: p.price * ((j % 2) + 1),
        discount: 0,
        shipping: 12,
        tax: 0,
        total: p.price * ((j % 2) + 1) + 12,
        shippingAddress: { firstName: c.name.split(" ")[0], lastName: c.name.split(" ")[1] || "", address: "123 Demo St", city: "Austin", state: "TX", zip: "73301", country: "United States", phone: "+1 555 000 0000" },
        billingAddress: { firstName: c.name.split(" ")[0], lastName: c.name.split(" ")[1] || "", address: "123 Demo St", city: "Austin", state: "TX", zip: "73301", country: "United States", phone: "+1 555 000 0000" },
        paymentMethod: "card",
        payment: { status: "succeeded", method: "card" },
        status: ["pending", "processing", "shipped", "delivered"][(i + j) % 4],
        createdAt: new Date(now - (i * 2 + j) * 24 * 3600 * 1000),
      }))
    );
    await Order.insertMany(orders);
    console.log(`[seed] Demo orders: ${orders.length}`);
  }
}

async function run() {
  await mongoose.connect(config.db.uri, { serverSelectionTimeoutMS: 10000 });
  console.log(`[seed] Connected to ${config.db.uri}`);

  if (DESTROY) {
    console.warn("[seed] Destroying existing data...");
    await Promise.all([
      User.deleteMany({ role: { $ne: ROLES.SUPER_ADMIN } }),
      Product.deleteMany({}),
      Category.deleteMany({}),
      Brand.deleteMany({}),
      Coupon.deleteMany({}),
      Faq.deleteMany({}),
      BlogPost.deleteMany({}),
      Banner.deleteMany({}),
      Order.deleteMany({}),
    ]);
  }

  await ensureDefaultPaymentMethods();
  await seedAdmin();
  await seedCatalog();
  await seedContent();
  if (WITH_DEMO) await seedDemoCustomersAndOrders();

  console.log("[seed] Done ✓");
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
