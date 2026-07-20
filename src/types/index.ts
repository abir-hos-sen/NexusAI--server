export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  role: "user" | "admin";
  bio?: string;
  location?: string;
  website?: string;
  isPremium: boolean;
  stripeCustomerId?: string;
  savedItems: string[];
  preferences: {
    categories: string[];
    priceRange: { min: number; max: number };
    aiInterests: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IItem {
  _id: string;
  title: string;
  slug: string;
  description: string;
  fullDescription: string;
  price: number;
  originalPrice?: number;
  category: string;
  tags: string[];
  images: string[];
  thumbnail: string;
  seller: string;
  rating: number;
  reviewCount: number;
  downloads: number;
  status: "active" | "draft" | "archived";
  featured: boolean;
  aiGenerated: boolean;
  metaInfo: {
    format?: string;
    size?: string;
    compatibility?: string;
    version?: string;
    lastUpdated: Date;
  };
  specifications: { key: string; value: string }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IChatMessage {
  _id: string;
  conversationId: string;
  userId: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: {
    itemId?: string;
    action?: string;
    confidence?: number;
  };
  createdAt: Date;
}

export interface IConversation {
  _id: string;
  userId: string;
  title: string;
  lastMessage: string;
  messageCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrder {
  _id: string;
  userId: string;
  items: { itemId: string; title: string; price: number; quantity: number }[];
  totalAmount: number;
  stripePaymentIntentId: string;
  status: "pending" | "completed" | "failed" | "refunded";
  createdAt: Date;
  updatedAt: Date;
}

export interface IReview {
  _id: string;
  userId: string;
  itemId: string;
  rating: number;
  comment: string;
  helpful: number;
  createdAt: Date;
}

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  itemCount: number;
}
