/**
 * Seed fashion catalog demo — categories + products for homepage catalog preview.
 * Usage: node scripts/seed-catalog-demo.js
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "../src/modules/categories/categories.model.js";
import Product from "../src/modules/products/products.model.js";
import { createSlug } from "../src/utils/slugify.js";

dotenv.config();

const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/novamart";

const CATEGORIES = [
  {
    name: "Festive Unstitched",
    description: "Premium lawn and chiffon suits for every celebration.",
    image: "https://images.unsplash.com/photo-1595777457583-95e059581990?w=600&h=800&fit=crop",
    featured: true,
    order: 1,
  },
  {
    name: "Festive Pret",
    description: "Ready-to-wear elegance with intricate embroidery.",
    image: "https://images.unsplash.com/photo-1581047134799-894feeb330e2?w=600&h=800&fit=crop",
    featured: true,
    order: 2,
  },
  {
    name: "Luxury Collection",
    description: "Handcrafted pieces for statement occasions.",
    image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&h=800&fit=crop",
    featured: false,
    order: 3,
  },
  {
    name: "Accessories",
    description: "Dupattas, bags, and finishing touches.",
    image: "https://images.unsplash.com/photo-1594633312681-425a7b956cc9?w=600&h=800&fit=crop",
    featured: false,
    order: 4,
  },
];

const PRODUCTS = [
  {
    name: "Noor Embroidered Lawn Suit",
    brand: "NovaMart",
    category: "Festive Unstitched",
    categorySlug: "festive-unstitched",
    description: "3-piece lawn with thread embroidery and printed dupatta.",
    features: ["Premium lawn", "Embroidered neckline", "Printed dupatta"],
    price: 89,
    compareAtPrice: 110,
    stock: 24,
    sku: "NM-UNST-001",
    tags: ["New Arrival"],
    isFeatured: true,
    isBestSeller: true,
    isNew: true,
    onSale: true,
    discountPercent: 19,
    images: ["https://images.unsplash.com/photo-1595777457583-95e059581990?w=700&h=900&fit=crop"],
    position: 1,
  },
  {
    name: "Rang Mahal Chiffon 3-Piece",
    brand: "NovaMart",
    category: "Festive Unstitched",
    categorySlug: "festive-unstitched",
    description: "Sheer chiffon with sequin detailing and silk trousers.",
    features: ["Chiffon shirt", "Sequin work", "Silk trouser"],
    price: 145,
    stock: 18,
    sku: "NM-UNST-002",
    tags: ["Bestseller"],
    isBestSeller: true,
    isTrending: true,
    images: ["https://images.unsplash.com/photo-1581047134799-894feeb330e2?w=700&h=900&fit=crop"],
    position: 2,
  },
  {
    name: "Zari Work Pret Kurta",
    brand: "NovaMart",
    category: "Festive Pret",
    categorySlug: "festive-pret",
    description: "Ready-to-wear kurta with gold zari borders.",
    features: ["Zari borders", "Cotton silk blend", "Fully lined"],
    price: 72,
    compareAtPrice: 95,
    stock: 30,
    sku: "NM-PRET-001",
    tags: ["Sale"],
    isFeatured: true,
    onSale: true,
    discountPercent: 24,
    sizes: ["XS", "S", "M", "L", "XL"],
    images: ["https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=700&h=900&fit=crop"],
    position: 3,
  },
  {
    name: "Mehfil Embroidered Shalwar",
    brand: "NovaMart",
    category: "Festive Pret",
    categorySlug: "festive-pret",
    description: "Festive pret set with hand-embroidered motifs.",
    features: ["Hand embroidery", "Organza dupatta", "Palazzo cut"],
    price: 98,
    stock: 15,
    sku: "NM-PRET-002",
    tags: ["Limited"],
    isNew: true,
    sizes: ["S", "M", "L"],
    images: ["https://images.unsplash.com/photo-1594633312681-425a7b956cc9?w=700&h=900&fit=crop"],
    position: 4,
  },
  {
    name: "Royal Velvet Shawl",
    brand: "NovaMart",
    category: "Luxury Collection",
    categorySlug: "luxury-collection",
    description: "Pure velvet shawl with antique gold trim.",
    features: ["Pure velvet", "Gold trim", "Gift box included"],
    price: 165,
    stock: 10,
    sku: "NM-LUX-001",
    tags: ["Luxury"],
    isFeatured: true,
    images: ["https://images.unsplash.com/photo-1601924994987-69fb26d0c737?w=700&h=900&fit=crop"],
    position: 5,
  },
  {
    name: "Silk Organza Dupatta",
    brand: "NovaMart",
    category: "Accessories",
    categorySlug: "accessories",
    description: "Lightweight organza with scalloped edges.",
    features: ["Silk organza", "Scalloped hem", "Multiple colors"],
    price: 45,
    stock: 40,
    sku: "NM-ACC-001",
    tags: ["Essential"],
    isBestSeller: true,
    images: ["https://images.unsplash.com/photo-1617137968427-85924c800a22?w=700&h=900&fit=crop"],
    position: 6,
  },
  {
    name: "Jashn Printed Lawn",
    brand: "NovaMart",
    category: "Festive Unstitched",
    categorySlug: "festive-unstitched",
    description: "Vibrant digital print on premium lawn fabric.",
    features: ["Digital print", "Soft lawn", "3-piece set"],
    price: 68,
    stock: 35,
    sku: "NM-UNST-003",
    tags: ["Summer"],
    images: ["https://picsum.photos/seed/jashn-lawn/700/900"],
    position: 7,
  },
  {
    name: "Sitaray Chiffon Collection",
    brand: "NovaMart",
    category: "Festive Unstitched",
    categorySlug: "festive-unstitched",
    description: "Star-motif chiffon with contrast piping.",
    features: ["Star motifs", "Contrast piping", "Festive palette"],
    price: 132,
    compareAtPrice: 160,
    stock: 12,
    sku: "NM-UNST-004",
    tags: ["Premium"],
    onSale: true,
    discountPercent: 18,
    images: ["https://picsum.photos/seed/sitaray-chiffon/700/900"],
    position: 8,
  },
  {
    name: "Gulzar Pret Maxi",
    brand: "NovaMart",
    category: "Festive Pret",
    categorySlug: "festive-pret",
    description: "Flowing maxi with floral block print.",
    features: ["Block print", "Maxi length", "Side slits"],
    price: 85,
    stock: 20,
    sku: "NM-PRET-003",
    tags: ["Trending"],
    isTrending: true,
    sizes: ["S", "M", "L", "XL"],
    images: ["https://picsum.photos/seed/gulzar-maxi/700/900"],
    position: 9,
  },
  {
    name: "Chandni Embroidered Top",
    brand: "NovaMart",
    category: "Festive Pret",
    categorySlug: "festive-pret",
    description: "Moonlight-inspired embroidery on raw silk.",
    features: ["Raw silk", "Moonlight embroidery", "Relaxed fit"],
    price: 78,
    stock: 22,
    sku: "NM-PRET-004",
    tags: ["New"],
    isNew: true,
    sizes: ["XS", "S", "M", "L"],
    images: ["https://picsum.photos/seed/chandni-top/700/900"],
    position: 10,
  },
  {
    name: "Heritage Banarsi Dupatta",
    brand: "NovaMart",
    category: "Luxury Collection",
    categorySlug: "luxury-collection",
    description: "Authentic banarsi weave with gold zari.",
    features: ["Banarsi weave", "Gold zari", "Heirloom quality"],
    price: 220,
    compareAtPrice: 280,
    stock: 8,
    sku: "NM-LUX-002",
    tags: ["Heritage"],
    isFeatured: true,
    onSale: true,
    discountPercent: 21,
    images: ["https://picsum.photos/seed/banarsi-dupatta/700/900"],
    position: 11,
  },
  {
    name: "Pearl Clutch Bag",
    brand: "NovaMart",
    category: "Accessories",
    categorySlug: "accessories",
    description: "Evening clutch with pearl embellishment.",
    features: ["Pearl detail", "Chain strap", "Evening wear"],
    price: 55,
    stock: 25,
    sku: "NM-ACC-002",
    tags: ["Evening"],
    images: ["https://picsum.photos/seed/pearl-clutch/700/900"],
    position: 12,
  },
  {
    name: "Eid Special Lawn Bundle",
    brand: "NovaMart",
    category: "Festive Unstitched",
    categorySlug: "festive-unstitched",
    description: "Limited Eid bundle with bonus dupatta.",
    features: ["Bonus dupatta", "Gift packaging", "Limited stock"],
    price: 95,
    compareAtPrice: 125,
    stock: 14,
    sku: "NM-UNST-005",
    tags: ["Eid Special"],
    onSale: true,
    discountPercent: 24,
    isBestSeller: true,
    images: ["https://picsum.photos/seed/eid-lawn/700/900"],
    position: 13,
  },
  {
    name: "Velvet Pret Gown",
    brand: "NovaMart",
    category: "Luxury Collection",
    categorySlug: "luxury-collection",
    description: "Floor-length velvet gown for formal events.",
    features: ["Pure velvet", "Floor length", "Inner lining"],
    price: 195,
    compareAtPrice: 240,
    stock: 6,
    sku: "NM-LUX-003",
    tags: ["Formal"],
    onSale: true,
    discountPercent: 19,
    sizes: ["S", "M", "L"],
    images: ["https://picsum.photos/seed/velvet-gown/700/900"],
    position: 14,
  },
  {
    name: "Crystal Drop Earrings",
    brand: "NovaMart",
    category: "Accessories",
    categorySlug: "accessories",
    description: "Statement earrings with crystal drops.",
    features: ["Crystal drops", "Gold plated", "Hypoallergenic"],
    price: 32,
    stock: 50,
    sku: "NM-ACC-003",
    tags: ["Jewelry"],
    images: ["https://picsum.photos/seed/crystal-earrings/700/900"],
    position: 15,
  },
  {
    name: "Classic Cotton Kurta",
    brand: "NovaMart",
    category: "Festive Pret",
    categorySlug: "festive-pret",
    description: "Everyday cotton kurta with minimal embroidery.",
    features: ["Pure cotton", "Breathable", "Machine washable"],
    price: 48,
    compareAtPrice: 62,
    stock: 45,
    sku: "NM-PRET-005",
    tags: ["Everyday"],
    onSale: true,
    discountPercent: 23,
    isBestSeller: true,
    sizes: ["S", "M", "L", "XL", "XXL"],
    images: ["https://picsum.photos/seed/cotton-kurta/700/900"],
    position: 16,
  },
];

async function main() {
  await mongoose.connect(uri);

  const categoryMap = new Map();
  for (const cat of CATEGORIES) {
    const slug = createSlug(cat.name);
    const doc = await Category.findOneAndUpdate(
      { slug },
      {
        $set: {
          name: cat.name,
          slug,
          description: cat.description,
          image: cat.image,
          featured: cat.featured,
          order: cat.order,
          isActive: true,
        },
      },
      { upsert: true, new: true }
    );
    categoryMap.set(slug, doc);
  }

  let created = 0;
  for (const p of PRODUCTS) {
    const slug = createSlug(p.name);
    const cat = categoryMap.get(p.categorySlug);
    await Product.findOneAndUpdate(
      { slug },
      {
        $set: {
          ...p,
          slug,
          categoryRef: cat?._id ?? null,
          isActive: true,
          rating: 4.5 + (created % 5) * 0.1,
          reviewsCount: 20 + created * 7,
        },
      },
      { upsert: true, new: true }
    );
    created += 1;
  }

  for (const [slug, cat] of categoryMap) {
    const count = await Product.countDocuments({ categorySlug: slug, isActive: true });
    await Category.updateOne({ _id: cat._id }, { $set: { count } });
  }

  console.log(`[seed-catalog-demo] Categories: ${CATEGORIES.length}, Products: ${created}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("[seed-catalog-demo] Failed:", err.message);
  process.exit(1);
});
