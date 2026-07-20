import mongoose, { Schema, Document } from "mongoose";

export interface ItemDocument extends Document {
  title: string;
  slug: string;
  description: string;
  fullDescription: string;
  price: number;
  originalPrice: number;
  category: string;
  tags: string[];
  images: string[];
  thumbnail: string;
  seller: mongoose.Types.ObjectId;
  rating: number;
  reviewCount: number;
  downloads: number;
  status: "active" | "draft" | "archived";
  featured: boolean;
  aiGenerated: boolean;
  metaInfo: {
    format: string;
    size: string;
    compatibility: string;
    version: string;
    lastUpdated: Date;
  };
  specifications: { key: string; value: string }[];
}

const itemSchema = new Schema<ItemDocument>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    fullDescription: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    category: { type: String, required: true, index: true },
    tags: [{ type: String }],
    images: [{ type: String }],
    thumbnail: { type: String, default: "" },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "draft", "archived"], default: "active" },
    featured: { type: Boolean, default: false },
    aiGenerated: { type: Boolean, default: false },
    metaInfo: {
      format: { type: String, default: "" },
      size: { type: String, default: "" },
      compatibility: { type: String, default: "" },
      version: { type: String, default: "1.0" },
      lastUpdated: { type: Date, default: Date.now },
    },
    specifications: [
      {
        key: { type: String },
        value: { type: String },
      },
    ],
  },
  { timestamps: true }
);

itemSchema.index({ title: "text", description: "text", tags: "text" });
itemSchema.index({ category: 1, price: 1 });
itemSchema.index({ rating: -1 });
itemSchema.index({ createdAt: -1 });

export const Item = mongoose.model<ItemDocument>("Item", itemSchema);
