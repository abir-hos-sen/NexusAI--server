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
import { User } from "./models";

const app = express();

// Middleware
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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
app.get("/api/health", (_, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

async function seedDefaultUsers() {
  const defaults = [
    { name: "Demo User", email: "demo@nexusai.com", password: "demo123456", role: "user" as const },
    { name: "Admin", email: "admin@nexusai.com", password: "admin123456", role: "admin" as const },
  ];

  for (const userData of defaults) {
    const exists = await User.findOne({ email: userData.email });
    if (!exists) {
      await User.create(userData);
      console.log(`Created ${userData.role} user: ${userData.email}`);
    }
  }
}

// Start server
const start = async () => {
  await connectDB();
  await seedDefaultUsers();
  app.listen(config.port, () => {
    console.log(`NexusAI server running on port ${config.port}`);
  });
};

start();
