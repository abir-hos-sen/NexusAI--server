import mongoose, { Schema, Document } from "mongoose";

export interface ConversationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  lastMessage: string;
  messageCount: number;
  isActive: boolean;
}

const conversationSchema = new Schema<ConversationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, default: "New Conversation" },
    lastMessage: { type: String, default: "" },
    messageCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

conversationSchema.index({ userId: 1, updatedAt: -1 });

export const Conversation = mongoose.model<ConversationDocument>("Conversation", conversationSchema);
