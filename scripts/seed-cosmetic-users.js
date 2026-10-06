/**
 * Seed Store demo users.
 * Run: node scripts/seed-cosmetic-users.js  (from Backend/)
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../src/modules/users/users.model.js";

dotenv.config();

const USERS = [
  { name: "Store Admin", email: "admin@store.com", password: "Store@123456", role: "admin" },
  { name: "Store Customer", email: "customer@store.com", password: "Store@123456", role: "customer" },
];

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  for (const u of USERS) {
    const hashed = await bcrypt.hash(u.password, 10);
    await User.findOneAndUpdate(
      { email: u.email },
      { name: u.name, email: u.email, password: hashed, role: u.role, isActive: true },
      { upsert: true, new: true }
    );
    console.log(`User ready: ${u.email} (${u.role})`);
  }

  console.log("Done.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
