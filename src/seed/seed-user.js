import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import config from "../config/index.js";
import User from "../modules/users/users.model.js";
import { ROLES } from "../constants/index.js";

const customerData = {
  name: "John Doe",
  email: "john@example.com",
  password: "User@123456",
  phone: "+1 555 123 4567",
  role: ROLES.CUSTOMER,
  isEmailVerified: true,
};

async function seedUser() {
  await mongoose.connect(config.db.uri, { serverSelectionTimeoutMS: 10000 });
  console.log(`[seed-user] Connected to ${config.db.uri}`);

  const hashedPassword = await bcrypt.hash(customerData.password, 10);

  const user = await User.findOneAndUpdate(
    { email: customerData.email },
    {
      $setOnInsert: {
        name: customerData.name,
        email: customerData.email,
        password: hashedPassword,
        phone: customerData.phone,
        role: customerData.role,
        isEmailVerified: customerData.isEmailVerified,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`[seed-user] User ready: ${user.email} (role: ${user.role})`);
  await mongoose.disconnect();
  process.exit(0);
}

seedUser().catch((err) => {
  console.error("[seed-user] Failed:", err);
  process.exit(1);
});
