import mongoose from "mongoose";

const faqSchema = new mongoose.Schema(
  {
    category: { type: String, default: "General", index: true },
    question: { type: String, required: [true, "Question is required."], trim: true },
    answer: { type: String, required: [true, "Answer is required."], trim: true },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

faqSchema.index({ category: 1, order: 1 });

const Faq = mongoose.model("Faq", faqSchema);

export default Faq;
