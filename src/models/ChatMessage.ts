import mongoose, { Schema, Document } from "mongoose";

export interface ChatMessageDocument extends Document {
  conversationId: string;
  userId: mongoose.Types.ObjectId;
  role: "user" | "assistant" | "system";
  content: string;
  metadata: {
    itemId?: mongoose.Types.ObjectId;
    action?: string;
    confidence?: number;
  };
}

const chatMessageSchema = new Schema<ChatMessageDocument>(
  {
    conversationId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["user", "assistant", "system"], required: true },
    content: { type: String, required: true },
    metadata: {
      itemId: { type: Schema.Types.ObjectId, ref: "Item" },
      action: { type: String },
      confidence: { type: Number },
    },
  },
  { timestamps: true }
);

chatMessageSchema.index({ conversationId: 1, createdAt: 1 });

export const ChatMessage = mongoose.model<ChatMessageDocument>("ChatMessage", chatMessageSchema);
