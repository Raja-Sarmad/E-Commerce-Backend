import mongoose from "mongoose";
import { ALL_ROLES } from "../../constants/index.js";

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Role name is required."], unique: true, trim: true },
    key: { type: String, unique: true, enum: ALL_ROLES, index: true },
    description: { type: String, default: "" },
    color: { type: String, default: "primary" },
    members: { type: Number, default: 0 },
    permissions: { type: Map, of: [String], default: {} },
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Role = mongoose.model("Role", roleSchema);

export default Role;
