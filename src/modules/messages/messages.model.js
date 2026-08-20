import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required."], trim: true },
    email: { type: String, required: [true, "Email is required."], trim: true },
    subject: { type: String, required: [true, "Subject is required."], trim: true },
    message: { type: String, required: [true, "Message is required."], trim: true },
    status: {
      type: String,
      enum: ["unread", "read", "archived"],
      default: "unread",
      index: true,
    },
    starred: { type: Boolean, default: false },
  },
  { timestamps: true }
);

messageSchema.index({ status: 1, createdAt: -1 });
messageSchema.index({ email: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
