import mongoose, { Schema, Document } from "mongoose";

export interface ContactMessageDocument extends Document {
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "new" | "read" | "replied";
}

const contactMessageSchema = new Schema<ContactMessageDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["new", "read", "replied"], default: "new" },
  },
  { timestamps: true }
);

export const ContactMessage = mongoose.model<ContactMessageDocument>("ContactMessage", contactMessageSchema);
