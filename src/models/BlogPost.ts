import mongoose, { Schema, Document } from "mongoose";

export interface BlogPostDocument extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  readTime: string;
  featured: boolean;
  image: string;
}

const blogPostSchema = new Schema<BlogPostDocument>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, required: true },
    author: { type: String, default: "NexusAI Team" },
    readTime: { type: String, default: "5 min read" },
    featured: { type: Boolean, default: false },
    image: { type: String, default: "" },
  },
  { timestamps: true }
);

export const BlogPost = mongoose.model<BlogPostDocument>("BlogPost", blogPostSchema);
