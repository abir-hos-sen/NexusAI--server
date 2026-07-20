import mongoose, { Schema, Document } from "mongoose";

export interface OrderDocument extends Document {
  userId: mongoose.Types.ObjectId;
  items: { itemId: mongoose.Types.ObjectId; title: string; price: number; quantity: number }[];
  totalAmount: number;
  stripePaymentIntentId: string;
  status: "pending" | "completed" | "failed" | "refunded";
}

const orderSchema = new Schema<OrderDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true },
        title: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, default: 1 },
      },
    ],
    totalAmount: { type: Number, required: true },
    stripePaymentIntentId: { type: String, default: "" },
    status: { type: String, enum: ["pending", "completed", "failed", "refunded"], default: "pending" },
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ stripePaymentIntentId: 1 });

export const Order = mongoose.model<OrderDocument>("Order", orderSchema);
