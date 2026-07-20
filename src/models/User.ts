import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface UserDocument extends Document {
  name: string;
  email: string;
  password: string;
  avatar: string;
  role: "user" | "admin";
  bio: string;
  location: string;
  website: string;
  isPremium: boolean;
  stripeCustomerId: string;
  savedItems: mongoose.Types.ObjectId[];
  preferences: {
    categories: string[];
    priceRange: { min: number; max: number };
    aiInterests: string[];
  };
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    avatar: { type: String, default: "" },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    bio: { type: String, default: "" },
    location: { type: String, default: "" },
    website: { type: String, default: "" },
    isPremium: { type: Boolean, default: false },
    stripeCustomerId: { type: String, default: "" },
    savedItems: [{ type: Schema.Types.ObjectId, ref: "Item" }],
    preferences: {
      categories: [{ type: String }],
      priceRange: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 1000 },
      },
      aiInterests: [{ type: String }],
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<UserDocument>("User", userSchema);
