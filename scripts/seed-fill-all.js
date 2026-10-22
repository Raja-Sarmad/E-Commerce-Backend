/**
 * Fill every tenant with a rich demo catalog + shared site content.
 * Safe to re-run (skips existing SKUs / unique slugs).
 *
 *   node scripts/seed-fill-all.js
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import Store from "../src/modules/stores/stores.model.js";
import Category from "../src/modules/categories/categories.model.js";
import Product from "../src/modules/products/products.model.js";
import Brand from "../src/modules/brands/brands.model.js";
import Banner from "../src/modules/banners/banners.model.js";
import Faq from "../src/modules/faqs/faqs.model.js";
import Page from "../src/modules/pages/pages.model.js";
import BlogPost from "../src/modules/blog/blog.model.js";
import Coupon from "../src/modules/coupons/coupons.model.js";
import User from "../src/modules/users/users.model.js";
import { createSlug } from "../src/utils/slugify.js";

dotenv.config();

const img = (seed, w = 700, h = 900) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;

const STORES = [
  { slug: "ecommerce", name: "NovaMart" },
  { slug: "store", name: "Sab Pehno" },
  { slug: "warqu", name: "Warqu" },
  { slug: "cosmetic", name: "Cosmetic (Veya)" },
];

const USERS = [
  { name: "Warqu Admin", email: "admin@warqu.com", password: "Warqu@123456", role: "admin" },
  { name: "Warqu Customer", email: "customer@warqu.com", password: "Warqu@123456", role: "customer" },
  { name: "Store Admin", email: "admin@store.com", password: "Store@123456", role: "admin" },
  { name: "Store Customer", email: "customer@store.com", password: "Store@123456", role: "customer" },
  { name: "Super Admin", email: "admin@sabpehno.com", password: "Admin@123456", role: "super_admin" },
  { name: "Demo Customer", email: "john@example.com", password: "User@123456", role: "customer" },
];

/** Per-tenant category + product blueprints */
const TENANTS = {
  warqu: {
    brand: "Warqu",
    categories: [
      ["New Drop", "new-drop", "Fresh arrivals this season."],
      ["Sale", "sale", "Selected pieces on sale."],
      ["Accessories", "accessories", "Finishing marks and extras."],
      ["Bodys", "bodys", "Bodysuits and sculpted bases."],
      ["Bottoms", "pants", "Pants, shorts, trousers."],
      ["Coats", "coats", "Outer layers and coats."],
      ["Corsets", "corsets", "Structured corsetry."],
      ["Dresses", "dresses", "Glam and grunge dresses."],
      ["Jackets", "jackets", "Jackets and blazers."],
      ["Skirts", "skirts", "Midi, maxi, and mini skirts."],
      ["Special Edition", "special-edition", "Limited capsules."],
      ["Tops", "tops", "Bras, knits, and tops."],
    ],
    // [name, categorySlug, price, compare?, isNew, isBest, tags[], sizes[]]
    products: buildWarquProducts(),
  },
  store: {
    brand: "Sab Pehno",
    categories: [
      ["Everyday Dresses", "everyday-dresses", "Easy silhouettes for everyday plans."],
      ["Evening Edit", "evening-edit", "After-dark statement dresses."],
      ["Summer Florals", "summer-florals", "Light fabrics and florals."],
      ["Premium Occasionwear", "premium-occasionwear", "Refined occasion pieces."],
      ["Men's Essentials", "mens-essentials", "Tees and basics for men."],
      ["Men's Streetwear", "mens-streetwear", "Relaxed street layers."],
      ["Unstitched", "unstitched", "Unstitched lawn and chiffon."],
      ["Pret", "pret", "Ready-to-wear pret."],
    ],
    products: buildStoreProducts(),
  },
  ecommerce: {
    brand: "NovaMart",
    categories: [
      ["Electronics", "electronics", "Audio, wearables & gadgets."],
      ["Fashion", "fashion", "Apparel and accessories."],
      ["Home & Living", "home-living", "Furniture and decor."],
      ["Beauty & Care", "beauty-care", "Skincare and wellness."],
      ["Sports & Outdoors", "sports-outdoors", "Fitness and outdoor gear."],
      ["Toys & Kids", "toys-kids", "Toys and kids essentials."],
    ],
    products: buildEcommerceProducts(),
  },
  cosmetic: {
    brand: "Veya",
    categories: [
      ["Skincare", "skincare", "Cleansers, toners, essentials."],
      ["Serums", "serums", "Concentrated treatments."],
      ["Moisturizers", "moisturizers", "Creams and balms."],
      ["Body Care", "body-care", "Lotions, oils, rituals."],
      ["Hair Care", "hair-care", "Shampoo, oils, treatments."],
      ["Fragrance", "fragrance", "Soft forest-inspired scents."],
    ],
    products: buildCosmeticProducts(),
  },
};

function sizes(...list) {
  return list.length ? list : ["S", "M", "L"];
}

function buildWarquProducts() {
  const out = [];
  const dresses = [
    "Lurex Mini Cross Dress", "Halter Neck Caramel", "Mini Slip Cream", "Sunna Dress Plum",
    "Architecture Dress", "Mesh Dress", "Goodnightmoon Dress", "Backless Knit Maxi",
    "Classic Knit Maxi", "Silk Halter Maxi Pearl", "Maxi Halter Smoothie", "Black Velvet Pads Dress",
    "Dramatic Dress", "Blazer Dress", "Oversize Silk Dress", "Sunna Dress Classic",
    "Slimming Corset Dress Black", "Slimming Corset Dress White", "Mini Sleep Cappucino", "Long Sleepdress",
  ];
  dresses.forEach((name, i) => {
    out.push([
      name,
      i % 5 === 0 ? "new-drop" : i % 4 === 0 ? "sale" : "dresses",
      120 + (i % 12) * 28,
      i % 3 === 0 ? 180 + i * 5 : null,
      i % 2 === 0,
      i % 5 === 0,
      i % 4 === 0 ? ["sale", "new-drop"] : ["dresses", i % 2 === 0 ? "new-drop" : "special-edition"],
      sizes("XS", "S", "M", "L"),
    ]);
  });
  const corsets = [
    "Witch Corset", "Draped Fancy Corset", "Witch Velvet Corset", "Draped Corset Lime",
    "Architecture Corset", "Gloria Corset", "Draped Corset Classic", "Corset Body Freedom Blue",
    "Corset Body Energizing Yellow", "Corset Body Black",
  ];
  corsets.forEach((name, i) => {
    out.push([
      name,
      "corsets",
      189 + i * 22,
      i % 2 ? 260 : null,
      i < 4,
      i % 3 === 0,
      ["corsets", "new-drop"],
      sizes("S", "M", "One Size"),
    ]);
  });
  const bottoms = [
    "Faux Patent Leggins", "Candy Shorts Velvet", "Mid-waist Shorts", "Vynil Shorts",
    "Architecture Trousers", "Silk Midi Skirt Olive", "Back Slit Midi Skirt", "Silk Maxi Skirt Ecru",
    "Silk Mermaid Skirt",
  ];
  bottoms.forEach((name, i) => {
    const cat = name.toLowerCase().includes("skirt") ? "skirts" : "pants";
    out.push([
      name,
      cat,
      135 + i * 18,
      null,
      i % 2 === 0,
      name.includes("Architecture"),
      [cat, "new-drop"],
      sizes("XS", "S", "M", "L"),
    ]);
  });
  const tops = [
    "Velvet Bra Top", "V-Neck Top Navy", "Faux Fur Top", "Faux Leather Bra Top",
    "Velvet Choker Rose", "Faux Fur Hat",
  ];
  tops.forEach((name, i) => {
    const cat = name.includes("Hat") || name.includes("Choker") ? "accessories" : "tops";
    out.push([
      name,
      cat,
      90 + i * 15,
      i % 2 ? 120 : null,
      true,
      false,
      [cat, "sale"],
      sizes("XS-S", "S-M", "One Size"),
    ]);
  });
  const extras = [
    ["Faux Fur Lapel Coat", "coats", 940, null, true, true, ["coats", "special-edition", "new-drop"], ["One Size"]],
    ["Dune Wrap", "special-edition", 165, 210, true, false, ["special-edition", "sale"], ["One Size"]],
    ["Vinyl Trench Coat", "coats", 420, 510, true, false, ["coats", "new-drop"], ["S", "M", "L"]],
    ["Cropped Moto Jacket", "jackets", 289, null, true, true, ["jackets", "new-drop"], ["XS", "S", "M"]],
    ["Satin Bomber", "jackets", 256, 300, false, false, ["jackets", "sale"], ["S", "M", "L"]],
    ["Lace Up Bodysuit", "bodys", 188, null, true, false, ["bodys", "corsets"], ["S", "M"]],
    ["Sculpt Tank Body", "bodys", 142, 170, true, true, ["bodys", "new-drop"], ["XS", "S", "M", "L"]],
    [" pleated Mini Skirt", "skirts", 168, null, true, false, ["skirts"], ["S", "M", "L"]],
    ["Asymmetric Leather Skirt", "skirts", 245, null, false, true, ["skirts", "special-edition"], ["S", "M"]],
    ["Crystal Drop Earrings", "accessories", 78, 95, true, false, ["accessories", "sale"], ["One Size"]],
    ["Chain Belt Studio", "accessories", 64, null, true, false, ["accessories", "new-drop"], ["One Size"]],
    ["Mesh Opera Gloves", "accessories", 48, null, false, false, ["accessories"], ["One Size"]],
  ];
  // fix accidental leading space in one name
  extras[7][0] = "Pleated Mini Skirt";
  return [...out, ...extras];
}

function buildStoreProducts() {
  const out = [];
  const women = [
    ["Noor Everyday Midi", "everyday-dresses", 59, 79],
    ["Dune Cotton Shirt Dress", "everyday-dresses", 65, null],
    ["Olive Wrap Dress", "everyday-dresses", 54, 72],
    ["Sana Relaxed Maxi", "everyday-dresses", 69, null],
    ["Ayla Soft Day Dress", "everyday-dresses", 62, null],
    ["Midnight Satin Evening", "evening-edit", 119, null],
    ["Ruby Pleated Occasion", "evening-edit", 99, 135],
    ["Luna Black Slip", "evening-edit", 89, null],
    ["Amara Velvet Dress", "evening-edit", 109, 149],
    ["Noir Column Gown", "evening-edit", 129, null],
    ["Gul Floral Summer", "summer-florals", 79, null],
    ["Daisy Tie-Waist Midi", "summer-florals", 59, 79],
    ["Meadow Linen Maxi", "summer-florals", 85, null],
    ["Rose Garden Day", "summer-florals", 69, null],
    ["Bloom Wrap Floral", "summer-florals", 74, 95],
    ["Zara Embroidered Gown", "premium-occasionwear", 189, null],
    ["Pearl Occasion Dress", "premium-occasionwear", 169, 219],
    ["Ayla Silk Maxi Premium", "premium-occasionwear", 199, null],
    ["Royal Pleated Gown", "premium-occasionwear", 179, null],
    ["Ivory Sequin Pret", "pret", 149, null],
    ["Emerald Pret Kurta Set", "pret", 129, 159],
    ["Noor Lawn Unstitched", "unstitched", 89, 110],
    ["Rang Mahal Chiffon 3PC", "unstitched", 145, null],
    ["Saffron Jacquard Unstitched", "unstitched", 165, 199],
  ];
  women.forEach(([name, cat, price, compare], i) => {
    out.push([
      name,
      cat,
      price,
      compare,
      i % 3 === 0,
      i % 5 === 0,
      cat === "premium-occasionwear" ? ["Premium", "new-drop"] : [cat, i % 2 ? "new-drop" : "sale"],
      sizes("S", "M", "L", "XL"),
    ]);
  });
  const men = [
    ["Core Oversized Tee", "mens-essentials", 34, 45],
    ["Essential Tee", "mens-essentials", 32, null],
    ["Heavyweight Tee", "mens-essentials", 45, null],
    ["Relaxed Pocket Tee", "mens-essentials", 38, null],
    ["Ribbed Tank", "mens-essentials", 28, null],
    ["Long Sleeve Jersey", "mens-essentials", 42, 52],
    ["Logo Hoodie", "mens-streetwear", 59, 75],
    ["Minimal Crewneck", "mens-streetwear", 49, null],
    ["Utility Jacket", "mens-streetwear", 69, null],
    ["Cargo Track Pants", "mens-streetwear", 55, 70],
    ["Wide Denim", "mens-streetwear", 72, null],
    ["Coach Windbreaker", "mens-streetwear", 64, 80],
  ];
  men.forEach(([name, cat, price, compare], i) => {
    out.push([
      name,
      cat,
      price,
      compare,
      true,
      i % 2 === 0,
      [cat, "new-drop"],
      sizes("S", "M", "L", "XL"),
    ]);
  });
  // Extra wave of dress variants for denser catalog
  for (let i = 1; i <= 12; i += 1) {
    out.push([
      `Studio Look ${i} Dress`,
      i % 2 ? "everyday-dresses" : "evening-edit",
      70 + i * 7,
      i % 3 === 0 ? 110 + i * 5 : null,
      i % 2 === 0,
      i % 4 === 0,
      ["new-drop", i % 3 === 0 ? "sale" : "pret"],
      sizes("S", "M", "L", "XL"),
    ]);
  }
  return out;
}

function buildEcommerceProducts() {
  const items = [
    ["Aurora Wireless Headphones", "electronics", 199, 249],
    ["Pulse Fit Smartwatch", "electronics", 149, 199],
    ["Nova ANC Earbuds", "electronics", 89, 119],
    ["Lumen Desk Lamp", "home-living", 45, null],
    ["Cloud Drift Topper", "home-living", 129, null],
    ["Stoneware Mug Set", "home-living", 32, 40],
    ["Glow Ritual Serum", "beauty-care", 89, 109],
    ["Velvet Night Cream", "beauty-care", 54, null],
    ["Trail Runner Jacket", "sports-outdoors", 79, 99],
    ["Flex Yoga Mat", "sports-outdoors", 39, null],
    ["City Soft Hoodie", "fashion", 58, 72],
    ["Canvas Tote Classic", "fashion", 28, null],
    ["Star Builder Blocks", "toys-kids", 24, null],
    ["Soft Plush Fox", "toys-kids", 18, 22],
    ["Studio Mic Mini", "electronics", 69, null],
    ["Aroma Diffuser Oak", "home-living", 49, 65],
    ["SPF Daily Fluid", "beauty-care", 36, null],
    ["Trail Bottle 1L", "sports-outdoors", 22, null],
    ["Linen Shirt Oversized", "fashion", 48, 60],
    ["Puzzle Galaxy 1000", "toys-kids", 26, null],
    ["Noise Cancelling Travel Kit", "electronics", 119, 149],
    ["Smart LED Strip Kit", "electronics", 35, null],
    ["Ceramic Pour-Over Set", "home-living", 54, 68],
    ["Linen Duvet Cover", "home-living", 89, null],
    ["Retinol Night Pearls", "beauty-care", 64, 79],
    ["Lip Oil Sheer", "beauty-care", 22, null],
    ["Resistance Band Pack", "sports-outdoors", 19, null],
    ["Hiking Daypack 20L", "sports-outdoors", 58, 72],
    ["Wool Blend Beanie", "fashion", 24, null],
    ["Leather Card Holder", "fashion", 36, 45],
    ["Wooden Train Set", "toys-kids", 42, null],
    ["Sensory Soft Cubes", "toys-kids", 16, 20],
  ];
  return items.map(([name, cat, price, compare], i) => [
    name,
    cat,
    price,
    compare,
    i % 2 === 0,
    i % 4 === 0,
    [cat, i % 3 === 0 ? "bestseller" : "new"],
    ["One Size"],
  ]);
}

function buildCosmeticProducts() {
  const items = [
    ["Moss & Spruce Serum", "serums", 42, 52],
    ["Forest Dew Moisturizer", "moisturizers", 38, null],
    ["Canopy Cleansing Gel", "skincare", 28, 34],
    ["Root Glow Toner", "skincare", 26, null],
    ["Cedar Night Balm", "moisturizers", 44, null],
    ["Fern Eye Cream", "skincare", 36, 45],
    ["Pine Body Oil", "body-care", 32, null],
    ["Sage Body Lotion", "body-care", 29, 35],
    ["Birch Scrub", "body-care", 27, null],
    ["Rain Hair Oil", "hair-care", 31, null],
    ["Moss Shampoo", "hair-care", 24, 30],
    ["Soft Needle Conditioner", "hair-care", 24, null],
    ["Dawn Mist Fragrance", "fragrance", 58, 72],
    ["Ember Woods Eau Soft", "fragrance", 62, null],
    ["Vitamin Leaf Serum", "serums", 46, null],
    ["Clay Reset Mask", "skincare", 33, 40],
    ["Niacinamide Daily Drops", "serums", 39, null],
    ["Peptide Eye Gel", "skincare", 41, 50],
    ["Cloud Soft Cleansing Balm", "skincare", 30, null],
    ["Barrier Cream Rich", "moisturizers", 47, null],
    ["After-Sun Body Milk", "body-care", 26, 32],
    ["Scalp Refresh Mist", "hair-care", 23, null],
    ["Petal Soft Eau", "fragrance", 55, null],
    ["Hand Cream Cedar", "body-care", 18, null],
  ];
  return items.map(([name, cat, price, compare], i) => [
    name,
    cat,
    price,
    compare,
    i < 6,
    i % 3 === 0,
    [cat, i % 2 ? "new" : "bestseller"],
    ["One Size"],
  ]);
}

async function upsertStore(def) {
  return Store.findOneAndUpdate(
    { slug: def.slug },
    { $set: { name: def.name, slug: def.slug, isActive: true } },
    { upsert: true, new: true },
  );
}

async function seedUsers() {
  for (const u of USERS) {
    const hashed = await bcrypt.hash(u.password, 10);
    await User.findOneAndUpdate(
      { email: u.email },
      {
        name: u.name,
        email: u.email,
        password: hashed,
        role: u.role,
        isActive: true,
        isEmailVerified: true,
      },
      { upsert: true, new: true },
    );
    console.log(`  user: ${u.email}`);
  }
}

async function seedTenant(store, blueprint) {
  const catBySlug = new Map();
  for (const [order, [name, desiredSlug, description]] of blueprint.categories.entries()) {
    // Prefer store-scoped slug; fall back if a legacy global unique index collides.
    let slug = desiredSlug;
    const owned = await Category.findOne({ storeId: store._id, slug });
    if (!owned) {
      const clash = await Category.findOne({ slug });
      if (clash && String(clash.storeId) !== String(store._id)) {
        slug = `${store.slug}-${desiredSlug}`;
      }
    }
    const doc = await Category.findOneAndUpdate(
      { storeId: store._id, slug },
      {
        $set: {
          storeId: store._id,
          name,
          slug,
          description,
          image: img(`${store.slug}-cat-${desiredSlug}`, 600, 800),
          featured: order < 3,
          order,
          isActive: true,
        },
      },
      { upsert: true, new: true },
    );
    catBySlug.set(desiredSlug, doc);
    catBySlug.set(slug, doc);
  }

  let created = 0;
  let skipped = 0;
  for (const [index, row] of blueprint.products.entries()) {
    const [name, catSlug, price, compareAtPrice, isNew, isBestSeller, tags, sizeList] = row;
    const sku = `${store.slug.toUpperCase().slice(0, 3)}-${String(index + 1).padStart(4, "0")}`;
    if (await Product.exists({ storeId: store._id, sku })) {
      skipped += 1;
      continue;
    }
    const category = catBySlug.get(catSlug) || [...catBySlug.values()][0];
    const slugBase = createSlug(name);
    let slug = slugBase;
    let n = 2;
    while (await Product.exists({ storeId: store._id, slug })) {
      slug = `${slugBase}-${n++}`;
    }
    const onSale = !!compareAtPrice && compareAtPrice > price;
    await Product.create({
      name,
      sku,
      storeId: store._id,
      slug,
      brand: blueprint.brand,
      category: category.name,
      categorySlug: category.slug,
      categoryRef: category._id,
      description: `${name} — curated for ${store.name}. ${category.description || ""}`,
      price,
      compareAtPrice: compareAtPrice || null,
      stock: 20 + (index % 15),
      isNew: !!isNew,
      isBestSeller: !!isBestSeller,
      isFeatured: index % 6 === 0,
      onSale,
      tags: tags || [],
      images: [
        img(`${store.slug}-${sku}-a`),
        img(`${store.slug}-${sku}-b`),
        img(`${store.slug}-${sku}-c`),
      ],
      sizes: sizeList,
      variants: sizeList.map((size) => ({ size, stock: 5 + (index % 8) })),
      colors: ["black", "white", "beige"].slice(0, 1 + (index % 3)),
      wearType: store.slug === "store" ? (index % 2 ? "stitched" : "unstitched") : undefined,
      position: index + 1,
      isActive: true,
    });
    created += 1;
  }
  console.log(`  ${store.slug}: +${created} products (${skipped} existed), ${catBySlug.size} categories`);
}

async function seedSharedContent() {
  const brands = [
    ["Warqu", "Glam meets grunge fashion house."],
    ["Sab Pehno", "Everyday and occasion wear."],
    ["NovaMart", "Curated lifestyle and gadgets."],
    ["Veya", "Forest-inspired clean beauty."],
    ["Sonix", "Premium audio."],
    ["Lumen Home", "Modern living essentials."],
  ];
  for (const [name, description] of brands) {
    const slug = createSlug(name);
    await Brand.findOneAndUpdate(
      { slug },
      { $set: { name, slug, description, isActive: true, logo: img(`brand-${slug}`, 200, 200) } },
      { upsert: true, new: true },
    );
  }
  console.log(`  brands: ${brands.length}`);

  const banners = [
    ["Warqu New Drop", "homepage", "/all-products/", "SS collection is live"],
    ["Sab Pehno Premium", "homepage", "/collections", "Occasionwear edit"],
    ["NovaMart Deals", "homepage", "/shop", "Up to 30% off electronics"],
    ["Veya Forest Ritual", "homepage", "/catalog", "Serums & moisturizers"],
  ];
  for (const [title, position, link, subtitle] of banners) {
    await Banner.findOneAndUpdate(
      { title },
      {
        $set: {
          title,
          position,
          link,
          subtitle,
          image: img(`banner-${createSlug(title)}`, 1400, 600),
          active: true,
        },
      },
      { upsert: true, new: true },
    );
  }
  console.log(`  banners: ${banners.length}`);

  const faqs = [
    ["Orders", "How long does shipping take?", "Standard shipping is 3–7 business days depending on your city."],
    ["Orders", "Can I track my order?", "Yes — tracking appears on your account orders page after dispatch."],
    ["Returns", "What is the return window?", "You can request a return within 14 days of delivery for unused items."],
    ["Returns", "Who pays return shipping?", "Faulty items: we cover it. Change of mind: customer covers shipping."],
    ["Payments", "Which payment methods work?", "COD and supported online methods shown at checkout."],
    ["Payments", "Is checkout secure?", "Yes. Sessions use encrypted HTTPS and token-based auth."],
    ["Account", "How do I open the admin dashboard?", "Sign in with an admin account from the storefront login; you will be redirected to the shared dashboard."],
    ["Products", "Do sizes run true to size?", "Most pieces are true to size. Check the size list on each product page."],
  ];
  for (const [i, [category, question, answer]] of faqs.entries()) {
    await Faq.findOneAndUpdate(
      { question },
      { $set: { category, question, answer, order: i + 1, active: true } },
      { upsert: true, new: true },
    );
  }
  console.log(`  faqs: ${faqs.length}`);

  const pages = [
    ["About Us", "about", "We run multiple fashion and lifestyle brands from one shared commerce platform."],
    ["Shipping Policy", "shipping-policy", "Orders process within 24–48 hours. Delivery timelines vary by city."],
    ["Returns Policy", "returns-policy", "Unused items can be returned within 14 days with original packaging."],
    ["Privacy Policy", "privacy-policy", "We only use account data to fulfill orders and improve the shopping experience."],
    ["Terms of Service", "terms-of-service", "By using our storefronts you agree to our checkout and return terms."],
    ["Contact", "contact", "Email support@techxudo.com or use the contact form on each brand site."],
  ];
  for (const [title, slug, content] of pages) {
    await Page.findOneAndUpdate(
      { slug },
      {
        $set: {
          title,
          slug,
          content,
          metaTitle: title,
          metaDescription: content.slice(0, 140),
          published: true,
        },
      },
      { upsert: true, new: true },
    );
  }
  console.log(`  pages: ${pages.length}`);

  const posts = [
    ["How to style a corset this season", "Fashion", "Layer structured corsets over knits or under blazers for contrast."],
    ["Unstitched vs Pret: which to choose", "Guides", "Unstitched gives tailor freedom; pret is ready for immediate wear."],
    ["A simple skincare ritual", "Beauty", "Cleanse, treat with serum, seal with moisturizer — morning and night."],
    ["Gift edit under $50", "Shopping", "Small accessories, body care, and tees make easy gifts."],
  ];
  for (const [title, category, excerpt] of posts) {
    const slug = createSlug(title);
    await BlogPost.findOneAndUpdate(
      { slug },
      {
        $set: {
          title,
          slug,
          category,
          excerpt,
          content: `${excerpt}\n\nMore editorial notes coming soon for ${category.toLowerCase()} lovers.`,
          coverImage: img(`blog-${slug}`, 1200, 700),
          author: "Editorial",
          status: "published",
          featured: true,
          scheduledAt: new Date(),
        },
      },
      { upsert: true, new: true },
    );
  }
  console.log(`  blog: ${posts.length}`);

  const coupons = [
    ["WELCOME10", 10, "percentage"],
    ["WARQU15", 15, "percentage"],
    ["SABPEHNO20", 20, "percentage"],
    ["FLAT500", 500, "fixed"],
  ];
  const starts = new Date();
  const ends = new Date(Date.now() + 1000 * 60 * 60 * 24 * 90);
  for (const [code, value, type] of coupons) {
    await Coupon.findOneAndUpdate(
      { code },
      {
        $set: {
          code,
          type,
          value,
          minSpend: type === "fixed" ? 2000 : 0,
          maxUses: 1000,
          usedCount: 0,
          startsAt: starts,
          expiresAt: ends,
          active: true,
        },
      },
      { upsert: true, new: true },
    );
  }
  console.log(`  coupons: ${coupons.length}`);
}

async function main() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI missing");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected\n[1] Stores");
  const storeDocs = {};
  for (const s of STORES) {
    storeDocs[s.slug] = await upsertStore(s);
    console.log(`  store: ${s.slug}`);
  }

  console.log("\n[2] Users");
  await seedUsers();

  console.log("\n[3] Tenant catalogs");
  for (const [slug, blueprint] of Object.entries(TENANTS)) {
    await seedTenant(storeDocs[slug], blueprint);
  }

  console.log("\n[4] Shared content (brands, banners, FAQ, pages, blog, coupons)");
  await seedSharedContent();

  const counts = {};
  for (const slug of Object.keys(storeDocs)) {
    counts[slug] = await Product.countDocuments({ storeId: storeDocs[slug]._id, isActive: true });
  }
  console.log("\nDone. Active products:", counts);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
