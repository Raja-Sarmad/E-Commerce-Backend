import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import config from "../config/index.js";
import User from "../modules/users/users.model.js";
import { ROLES } from "../constants/index.js";
import { ensureDefaultPaymentMethods } from "./bootstrap.js";

async function seedAdmin() {
  await mongoose.connect(config.db.uri, { serverSelectionTimeoutMS: 10000 });
  console.log(`[seed-admin] Connected to ${config.db.uri}`);

  await ensureDefaultPaymentMethods();

  const { adminName, adminEmail, adminPassword, adminPhone } = config.seed;
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await User.findOneAndUpdate(
    { email: adminEmail },
    {
      $setOnInsert: {
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        phone: adminPhone,
        role: ROLES.SUPER_ADMIN,
        isEmailVerified: true,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`[seed-admin] Admin ready: ${admin.email} (role: ${admin.role})`);
  await mongoose.disconnect();
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("[seed-admin] Failed:", err);
  process.exit(1);
});
