import mongoose, { Schema, Document } from "mongoose";

export interface CategoryDocument extends Document {
  name: string;
  slug: string;
  description: string;
  icon: string;
  itemCount: number;
}

const categorySchema = new Schema<CategoryDocument>(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: "" },
    icon: { type: String, default: "📦" },
    itemCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Category = mongoose.model<CategoryDocument>("Category", categorySchema);
