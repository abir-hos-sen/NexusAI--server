import mongoose, { Schema, Document } from "mongoose";

export interface ReviewDocument extends Document {
  userId: mongoose.Types.ObjectId;
  itemId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  helpful: number;
}

const reviewSchema = new Schema<ReviewDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    helpful: { type: Number, default: 0 },
  },
  { timestamps: true }
);

reviewSchema.index({ itemId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, itemId: 1 }, { unique: true });

export const Review = mongoose.model<ReviewDocument>("Review", reviewSchema);
