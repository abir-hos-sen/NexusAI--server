import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { config } from "./config";
import { connectDB } from "./config/db";
import { errorHandler, notFound } from "./middleware/error";
import authRoutes from "./routes/auth";
import itemRoutes from "./routes/items";
import chatRoutes from "./routes/chat";
import paymentRoutes from "./routes/payment";
import adminRoutes from "./routes/admin";
import uploadRoutes from "./routes/upload";
import contactRoutes from "./routes/contact";
import blogRoutes from "./routes/blog";

const app = express();

// Middleware
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Connect to DB on first request
let dbConnected = false;
app.use(async (_req, _res, next) => {
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
    } catch (err) {
      console.error("DB connection failed:", err);
    }
  }
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/stripe", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/blog", blogRoutes);

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Health check
app.get("/api/health", async (_, res) => {
  try {
    await connectDB();
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Export for Vercel serverless
export default app;

// Local development
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  const start = async () => {
    await connectDB();
    app.listen(config.port, () => {
      console.log(`NexusAI server running on port ${config.port}`);
    });
  };
  start();
}
