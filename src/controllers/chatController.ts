import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { aiService } from "../services/aiService";
import { Conversation, ChatMessage } from "../models";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config";

const genAI = config.geminiApiKey
  ? new GoogleGenerativeAI(config.geminiApiKey)
  : null;

export const chatController = {
  async sendMessage(req: AuthRequest, res: Response) {
    try {
      const { message, conversationId } = req.body;
      const userId = req.user?._id;

      if (!message || !userId) {
        return res.status(400).json({ success: false, message: "Message is required" });
      }

      const response = await aiService.handleChat({
        userId,
        conversationId,
        message,
      });

      res.json({ success: true, ...response });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async streamMessage(req: AuthRequest, res: Response) {
    try {
      const { message, conversationId } = req.body;
      const userId = req.user?._id;

      if (!message || !userId) {
        return res.status(400).json({ success: false, message: "Message is required" });
      }

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");

      // Save user message and get/create conversation
      let convId = conversationId;
      let conversation = null;
      if (convId) {
        conversation = await Conversation.findOne({ _id: convId, userId });
      }
      if (!conversation) {
        conversation = await Conversation.create({
          userId,
          title: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
          lastMessage: message,
          messageCount: 0,
        });
        convId = conversation._id.toString();
      }

      await ChatMessage.create({ conversationId: convId, userId, role: "user", content: message });

      // Send conversation ID first
      res.write(`data: ${JSON.stringify({ type: "metadata", conversationId: convId })}\n\n`);

      if (genAI) {
        try {
          const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

          const systemPrompt = `You are the NexusAI AI Assistant — a helpful, friendly, and knowledgeable chatbot for the NexusAI digital product marketplace. Be concise but helpful (2-4 paragraphs max). Use markdown formatting.`;

          const chatHistory: { role: string; parts: { text: string }[] }[] = [
            { role: "user", parts: [{ text: systemPrompt }] },
            { role: "model", parts: [{ text: "I understand. I'm the NexusAI AI Assistant, ready to help." }] },
          ];

          // Add history
          const history = await ChatMessage.find({ conversationId: convId }).sort({ createdAt: -1 }).limit(10).lean();
          for (const msg of history.reverse()) {
            chatHistory.push({
              role: msg.role === "user" ? "user" : "model",
              parts: [{ text: msg.content }],
            });
          }

          const chat = model.startChat({ history: chatHistory });
          const result = await chat.sendMessageStream(message);

          let fullResponse = "";
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              fullResponse += text;
              res.write(`data: ${JSON.stringify({ type: "chunk", content: text })}\n\n`);
            }
          }

          // Save AI response
          await ChatMessage.create({ conversationId: convId, userId, role: "assistant", content: fullResponse });
          await Conversation.findByIdAndUpdate(convId, { lastMessage: fullResponse.slice(0, 200), $inc: { messageCount: 2 } });

          res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
          res.end();
          return;
        } catch (geminiError: any) {
          console.error("Gemini streaming error:", geminiError.message);
        }
      }

      // Fallback: use non-streaming
      const response = await aiService.handleChat({ userId, conversationId: convId, message });
      res.write(`data: ${JSON.stringify({ type: "chunk", content: response.message })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
      res.end();
    } catch (error: any) {
      res.write(`data: ${JSON.stringify({ type: "error", message: error.message })}\n\n`);
      res.end();
    }
  },

  async getConversations(req: AuthRequest, res: Response) {
    try {
      const conversations = await Conversation.find({ userId: req.user?._id })
        .sort({ updatedAt: -1 })
        .lean();

      res.json({ success: true, conversations });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getConversationMessages(req: AuthRequest, res: Response) {
    try {
      const { conversationId } = req.params;
      const messages = await ChatMessage.find({ conversationId, userId: req.user?._id })
        .sort({ createdAt: 1 })
        .lean();

      res.json({ success: true, messages });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async deleteConversation(req: AuthRequest, res: Response) {
    try {
      const { conversationId } = req.params;
      await ChatMessage.deleteMany({ conversationId });
      await Conversation.findByIdAndDelete(conversationId);
      res.json({ success: true, message: "Conversation deleted" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async generateContent(req: AuthRequest, res: Response) {
    try {
      const { type, topic, tone, length, additionalInfo } = req.body;

      if (!type || !topic) {
        return res.status(400).json({ success: false, message: "Type and topic are required" });
      }

      const content = await aiService.generateContent({
        type,
        topic,
        tone: tone || "professional",
        length: length || "medium",
        additionalInfo,
      });

      res.json({ success: true, content });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async generateImage(req: AuthRequest, res: Response) {
    try {
      const { description, style } = req.body;

      if (!description) {
        return res.status(400).json({ success: false, message: "Description is required" });
      }

      // Try Gemini for image generation
      if (genAI) {
        try {
          const stylePrompts: Record<string, string> = {
            modern: "modern, clean, professional, sleek design",
            minimal: "minimalist, simple, clean white background",
            vibrant: "vibrant, colorful, bold, energetic",
            ocean: "ocean blue, teal, aquatic, calming",
            sunset: "warm sunset colors, orange, pink, golden",
            forest: "natural, green, organic, earthy tones",
            dark: "dark mode, neon accents, cyberpunk, futuristic",
            candy: "pastel colors, soft, playful, cute",
          };

          const styleDesc = stylePrompts[style] || stylePrompts.modern;
          const prompt = `Generate a high-quality image: ${description}. Style: ${styleDesc}. Professional quality, detailed, 4K resolution.`;

          const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-preview-image-generation",
            generationConfig: { responseModalities: ["TEXT", "IMAGE"] } as any,
          });

          const result = await model.generateContent(prompt);
          const response = result.response;

          // Extract image from response
          for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData?.data) {
              const mimeType = part.inlineData.mimeType || "image/png";
              const base64Data = part.inlineData.data;
              const imageUrl = `data:${mimeType};base64,${base64Data}`;
              return res.json({ success: true, imageUrl });
            }
          }

          // If no image in response, return error
          return res.status(500).json({ success: false, message: "Gemini did not return an image. Try a different description." });
        } catch (geminiError: any) {
          console.error("Gemini image generation error:", geminiError.message);

          // If rate limited, return specific error
          if (geminiError.message?.includes("429") || geminiError.message?.includes("Too Many Requests") || geminiError.message?.includes("quota")) {
            return res.status(429).json({ success: false, message: "Gemini API daily quota exceeded. Free tier allows ~50 requests/day. Wait 24 hours or get a new key from aistudio.google.com/apikey" });
          }

          // For other errors, fall back to SVG
          const imageUrl = await generateProductImage(description, style || "modern");
          return res.json({ success: true, imageUrl, fallback: true });
        }
      }

      // No API key - use SVG template
      const imageUrl = await generateProductImage(description, style || "modern");
      res.json({ success: true, imageUrl, fallback: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getRecommendations(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?._id;
      const { limit, category, minPrice, maxPrice, sort } = req.query;

      if (!userId) {
        return res.status(401).json({ success: false, message: "User not authenticated" });
      }

      const recommendations = await aiService.getRecommendations(
        userId.toString(),
        parseInt(limit as string) || 6,
        { category: category as string, minPrice: minPrice ? Number(minPrice) : undefined, maxPrice: maxPrice ? Number(maxPrice) : undefined, sort: sort as string }
      );

      res.json({ success: true, recommendations });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

// ═══════════════════════════════════════════════════════════════
// ADVANCED SVG IMAGE GENERATOR - Multiple Templates
// ═══════════════════════════════════════════════════════════════
async function generateProductImage(description: string, style: string): Promise<string> {
  const styles: Record<string, { bg1: string; bg2: string; accent: string; text: string }> = {
    modern: { bg1: "#667eea", bg2: "#764ba2", accent: "#f093fb", text: "#ffffff" },
    minimal: { bg1: "#f5f7fa", bg2: "#c3cfe2", accent: "#667eea", text: "#2d3436" },
    vibrant: { bg1: "#f093fb", bg2: "#f5576c", accent: "#ffd93d", text: "#ffffff" },
    ocean: { bg1: "#4facfe", bg2: "#00f2fe", accent: "#43e97b", text: "#ffffff" },
    sunset: { bg1: "#fa709a", bg2: "#fee140", accent: "#f5576c", text: "#ffffff" },
    forest: { bg1: "#11998e", bg2: "#38ef7d", accent: "#fcf876", text: "#ffffff" },
    dark: { bg1: "#0c0c1d", bg2: "#1a1a3e", accent: "#667eea", text: "#e2e8f0" },
    candy: { bg1: "#ff9a9e", bg2: "#fecfef", accent: "#a18cd1", text: "#2d3436" },
    neon: { bg1: "#0f0c29", bg2: "#302b63", accent: "#00ff88", text: "#00ff88" },
    gradient: { bg1: "#6366f1", bg2: "#ec4899", accent: "#fbbf24", text: "#ffffff" },
  };

  const s = styles[style] || styles.modern;
  const words = description.split(/\s+/);
  const title = words.slice(0, 5).join(" ");
  const subtitle = words.slice(5, 10).join(" ") || "";

  // Pick icon based on description keywords
  let icon = "✦";
  const dl = description.toLowerCase();
  if (dl.includes("ai") || dl.includes("bot") || dl.includes("neural")) icon = "🤖";
  else if (dl.includes("code") || dl.includes("dev") || dl.includes("programming")) icon = "💻";
  else if (dl.includes("data") || dl.includes("chart") || dl.includes("analytics")) icon = "📊";
  else if (dl.includes("design") || dl.includes("ui") || dl.includes("creative")) icon = "🎨";
  else if (dl.includes("business") || dl.includes("market") || dl.includes("sell")) icon = "💼";
  else if (dl.includes("content") || dl.includes("blog") || dl.includes("write")) icon = "📝";
  else if (dl.includes("image") || dl.includes("photo") || dl.includes("picture")) icon = "🖼️";
  else if (dl.includes("template") || dl.includes("prompt")) icon = "⚡";
  else if (dl.includes("security") || dl.includes("protect")) icon = "🔒";
  else if (dl.includes("cloud") || dl.includes("server")) icon = "☁️";

  // Random decorative shapes
  const shape1X = 600 + Math.random() * 150;
  const shape1Y = 50 + Math.random() * 100;
  const shape2X = 50 + Math.random() * 100;
  const shape2Y = 400 + Math.random() * 150;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="768" viewBox="0 0 1024 768">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${s.bg1};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:${s.bg2};stop-opacity:1"/>
    </linearGradient>
    <linearGradient id="card" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:white;stop-opacity:0.98"/>
      <stop offset="100%" style="stop-color:#f8fafc;stop-opacity:0.95"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="shadow" x="-10%" y="-10%" width="130%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-opacity="0.15"/>
    </filter>
    <clipPath id="roundedClip"><rect width="1024" height="768" rx="0"/></clipPath>
  </defs>

  <!-- Background -->
  <rect width="1024" height="768" fill="url(#bg)"/>

  <!-- Decorative shapes -->
  <circle cx="${shape1X}" cy="${shape1Y}" r="180" fill="white" opacity="0.06"/>
  <circle cx="${shape2X}" cy="${shape2Y}" r="120" fill="white" opacity="0.04"/>
  <circle cx="900" cy="650" r="200" fill="white" opacity="0.03"/>
  <circle cx="512" cy="384" r="300" fill="white" opacity="0.02"/>

  <!-- Grid pattern -->
  <g opacity="0.05" stroke="white" stroke-width="1">
    <line x1="0" y1="100" x2="1024" y2="100"/>
    <line x1="0" y1="200" x2="1024" y2="200"/>
    <line x1="0" y1="300" x2="1024" y2="300"/>
    <line x1="0" y1="400" x2="1024" y2="400"/>
    <line x1="0" y1="500" x2="1024" y2="500"/>
    <line x1="0" y1="600" x2="1024" y2="600"/>
    <line x1="200" y1="0" x2="200" y2="768"/>
    <line x1="400" y1="0" x2="400" y2="768"/>
    <line x1="600" y1="0" x2="600" y2="768"/>
    <line x1="800" y1="0" x2="800" y2="768"/>
  </g>

  <!-- Main card -->
  <rect x="112" y="134" width="800" height="500" rx="24" fill="url(#card)" filter="url(#shadow)"/>

  <!-- Icon badge -->
  <circle cx="180" cy="220" r="40" fill="${s.bg1}" opacity="0.12"/>
  <text x="180" y="232" font-size="36" text-anchor="middle">${icon}</text>

  <!-- Title -->
  <text x="240" y="215" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="800" fill="#0f172a">
    ${title.length > 30 ? title.slice(0, 30) + "..." : title}
  </text>
  ${subtitle ? `<text x="240" y="255" font-family="system-ui, sans-serif" font-size="18" fill="#64748b">
    ${subtitle.length > 40 ? subtitle.slice(0, 40) + "..." : subtitle}
  </text>` : ""}

  <!-- Accent line -->
  <rect x="180" y="280" width="120" height="4" rx="2" fill="${s.bg1}"/>

  <!-- Feature pills -->
  <rect x="180" y="310" width="110" height="32" rx="16" fill="${s.bg1}" opacity="0.1"/>
  <text x="235" y="331" font-family="system-ui, sans-serif" font-size="13" font-weight="600" text-anchor="middle" fill="${s.bg1}">AI-Powered</text>

  <rect x="310" y="310" width="100" height="32" rx="16" fill="${s.bg2}" opacity="0.1"/>
  <text x="360" y="331" font-family="system-ui, sans-serif" font-size="13" font-weight="600" text-anchor="middle" fill="${s.bg2}">Premium</text>

  <rect x="430" y="310" width="90" height="32" rx="16" fill="#10ac84" opacity="0.1"/>
  <text x="475" y="331" font-family="system-ui, sans-serif" font-size="13" font-weight="600" text-anchor="middle" fill="#10ac84">2025</text>

  <!-- Price area -->
  <text x="180" y="410" font-family="system-ui, sans-serif" font-size="48" font-weight="900" fill="${s.bg1}">$29.99</text>
  <text x="390" y="410" font-family="system-ui, sans-serif" font-size="24" fill="#94a3b8" text-decoration="line-through">$49.99</text>
  <rect x="510" y="385" width="70" height="28" rx="14" fill="#10b981" opacity="0.15"/>
  <text x="545" y="405" font-family="system-ui, sans-serif" font-size="12" font-weight="700" text-anchor="middle" fill="#10b981">-40%</text>

  <!-- CTA Button -->
  <rect x="180" y="460" width="220" height="52" rx="26" fill="${s.bg1}"/>
  <text x="290" y="493" font-family="system-ui, sans-serif" font-size="16" font-weight="700" text-anchor="middle" fill="white">View Details →</text>

  <!-- Decorative dots -->
  <circle cx="780" cy="300" r="60" fill="${s.accent}" opacity="0.15"/>
  <circle cx="820" cy="360" r="40" fill="${s.bg1}" opacity="0.1"/>
  <circle cx="750" cy="420" r="30" fill="${s.bg2}" opacity="0.08"/>

  <!-- Stars -->
  <text x="180" y="560" font-family="system-ui, sans-serif" font-size="14" fill="#fbbf24">★★★★★</text>
  <text x="260" y="560" font-family="system-ui, sans-serif" font-size="14" fill="#94a3b8">4.8 (234 reviews)</text>

  <!-- Footer -->
  <text x="512" y="720" font-family="system-ui, sans-serif" font-size="14" font-weight="500" text-anchor="middle" fill="white" opacity="0.7">NexusAI Marketplace • Powered by AI</text>
</svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
