import dotenv from "dotenv";
import path from "path";

// Load .env file for local development (Vercel uses env vars from dashboard)
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  dotenv.config({ path: path.resolve(__dirname, "../../.env") });
}

export const config = {
  port: parseInt(process.env.PORT || "5000"),
  mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/nexusai",
  jwtSecret: process.env.JWT_SECRET || "fallback_secret_key",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
};
