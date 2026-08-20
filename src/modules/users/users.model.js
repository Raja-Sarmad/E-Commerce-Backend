import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { ROLES } from "../../constants/index.js";

const addressSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zip: { type: String, trim: true },
    country: { type: String, trim: true },
    phone: { type: String, trim: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
      minlength: [2, "Name must be at least 2 characters."],
      maxlength: [80, "Name must be under 80 characters."],
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address."],
    },
    password: {
      type: String,
      required: [true, "Password is required."],
      minlength: [8, "Password must be at least 8 characters."],
      select: false,
    },
    phone: { type: String, trim: true, default: "" },
    avatar: { type: String, default: "" },
    publicId: { type: String, default: "" },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CUSTOMER,
      index: true,
    },
    address: { type: addressSchema, default: null },

    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, default: null },

    passwordResetToken: { type: String, default: null },
    passwordResetExpires: { type: Date, default: null },

    refreshToken: { type: String, default: null },

    isBlocked: { type: Boolean, default: false },
    blockedAt: { type: Date, default: null },

    loyaltyPoints: { type: Number, default: 0 },
    tier: {
      type: String,
      enum: ["Bronze", "Silver", "Gold", "Platinum"],
      default: "Bronze",
    },
    lastLoginAt: { type: Date, default: null },

    ordersCount: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.refreshToken;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.emailVerificationToken;
        return ret;
      },
    },
  }
);

/* ── Indexes (query optimization) ───────────────────────────── */
userSchema.index({ role: 1, createdAt: -1 });
userSchema.index({ name: 1 });
userSchema.index({ createdAt: -1 });

/* ── Pre-save hooks ─────────────────────────────────────────── */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  return next();
});

/* ── Instance methods ───────────────────────────────────────── */
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.emailVerificationToken;
  return obj;
};

userSchema.methods.getAuthPayload = function () {
  return { _id: this._id, role: this.role };
};

/* ── Statics ────────────────────────────────────────────────── */
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: String(email).toLowerCase().trim() }).select(
    "+password +refreshToken"
  );
};

const User = mongoose.model("User", userSchema);

export default User;
