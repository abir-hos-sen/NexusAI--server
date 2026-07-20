import { Item, ChatMessage, Conversation, User } from "../models";
import mongoose from "mongoose";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config";

const genAI = config.geminiApiKey
  ? new GoogleGenerativeAI(config.geminiApiKey)
  : null;

interface ChatContext {
  userId: string;
  conversationId?: string;
  message: string;
}

interface AIResponse {
  message: string;
  conversationId: string;
  suggestions?: string[];
  metadata?: {
    action?: string;
    items?: any[];
    confidence?: number;
  };
}

// ═══════════════════════════════════════════════════════════════
// MASSIVE KNOWLEDGE BASE - Website + External Knowledge
// ═══════════════════════════════════════════════════════════════
const KNOWLEDGE_BASE: Record<string, string[]> = {
  // === WEBSITE KNOWLEDGE ===
  about_nexusai: [
    "NexusAI is an AI-powered smart marketplace for digital products and tools. We were founded in 2024 with a mission to make AI-powered digital products accessible to everyone. We serve over 10,000 users across 50+ countries.",
    "NexusAI connects creators with users who need cutting-edge AI solutions. Our platform features curated AI tools, AI-powered recommendations, secure Stripe payments, 24/7 AI assistant support, and community-driven reviews.",
  ],
  features: [
    "NexusAI offers these key features:\n\n🔍 **AI-Powered Search** - Find exactly what you need with intelligent search and recommendations\n🤖 **AI Chat Assistant** - 24/7 AI assistant to help you find products and answer questions\n📝 **AI Content Generator** - Generate blog posts, product descriptions, social media content\n🖼️ **AI Image Generator** - Create product images from text descriptions\n💡 **Smart Recommendations** - Personalized product suggestions based on your behavior\n💳 **Secure Payments** - Stripe-powered checkout with enterprise-grade security\n📦 **Digital Marketplace** - Buy and sell AI tools, templates, and digital resources",
  ],
  categories: [
    "We have 6 main product categories:\n\n🤖 **AI Templates** (120+ products) - Pre-built prompts and workflow templates for ChatGPT, Claude, Gemini\n🔧 **Developer Tools** (85+ products) - APIs, SDKs, code utilities, and dev resources\n✏️ **Content Creation** (95+ products) - Writing, image, and video generation tools\n📊 **Data Analytics** (60+ products) - Data analysis, visualization, and BI tools\n💼 **Business Tools** (70+ products) - Automation, productivity, and workflow solutions\n🎨 **Design Assets** (110+ products) - UI kits, icons, templates, and design systems",
  ],
  pricing_info: [
    "NexusAI pricing:\n\n🆓 **Free Tier** - Browse all products, limited AI chat, 5 content generations/month\n⭐ **Pro ($29/month)** - Unlimited AI chat, 100 content generations, 50 image generations\n👑 **Enterprise ($99/month)** - Everything unlimited, API access, custom integrations\n\nIndividual products range from $5 to $130. Many have discounts of 20-40%.",
  ],
  payment_info: [
    "We accept all major credit cards, debit cards, and digital wallets through Stripe. Your payment data is encrypted and never stored on our servers. We offer a 30-day money-back guarantee on all purchases. After successful payment, you get instant access to your digital products.",
  ],
  refund_policy: [
    "We offer a 30-day money-back guarantee on all purchases. If you're not satisfied, request a refund through your dashboard at /dashboard or contact support@nexusai.com. Digital products that have been downloaded can still be refunded within the guarantee period.",
  ],
  contact_info: [
    "Contact NexusAI:\n\n📧 **Email**: support@nexusai.com\n🐦 **Twitter**: @nexusai_support\n💬 **Live Chat**: Available 24/7 (you're using it now!)\n📍 **Location**: San Francisco, CA\n\nFor urgent issues, our AI assistant is always available to help!",
  ],
  how_to_buy: [
    "How to buy on NexusAI:\n\n1️⃣ Browse or search for products on the **Explore** page\n2️⃣ Click on a product to see details, reviews, and specifications\n3️⃣ Click **Buy Now** to open the payment form\n4️⃣ Enter your card details and click **Pay**\n5️⃣ Get instant access to your purchase!\n\nYou can manage all your purchases in the **Dashboard**.",
  ],
  how_to_sell: [
    "How to sell on NexusAI:\n\n1️⃣ Create an account or log in\n2️⃣ Go to **Dashboard** → **Add Item**\n3️⃣ Fill in title, description, price, category, and tags\n4️⃣ Click **Create Item**\n5️⃣ Your product is now listed on the marketplace!\n\nYou can manage your listings in **Dashboard** → **Manage Items**.",
  ],
  ai_chatbot_info: [
    "I am the NexusAI AI Assistant! Here's what I can do:\n\n🔍 **Search Products** - Find any product on our marketplace\n💡 **Product Info** - Get detailed info about any product\n📊 **Recommendations** - Get personalized suggestions\n📝 **Content Generation** - Write blog posts, descriptions, social media content\n🖼️ **Image Generation** - Create product images from descriptions\n💬 **Answer Questions** - Ask me anything about NexusAI or general topics\n🌐 **General Knowledge** - I know about technology, AI, programming, and much more!\n\nI remember our entire conversation, so you can ask follow-up questions!",
  ],

  // === GENERAL KNOWLEDGE ===
  what_is_ai: [
    "Artificial Intelligence (AI) is the simulation of human intelligence by computer systems. It includes:\n\n🧠 **Machine Learning** - Systems that learn from data\n🗣️ **Natural Language Processing** - Understanding human language\n👁️ **Computer Vision** - Interpreting images and video\n🤖 **Robotics** - Physical AI systems\n\nAI is used in recommendation systems (like ours!), chatbots, self-driving cars, medical diagnosis, and much more.",
  ],
  what_is_llm: [
    "Large Language Models (LLMs) are AI systems trained on massive text data to understand and generate human language. Examples include ChatGPT (OpenAI), Claude (Anthropic), Gemini (Google), and Llama (Meta). They power chatbots, content generation, code writing, translation, and many other applications.",
  ],
  what_is_stripe: [
    "Stripe is a leading online payment processing platform. It handles billions of dollars in transactions for millions of businesses worldwide. NexusAI uses Stripe for secure payment processing. It supports credit cards, debit cards, digital wallets (Apple Pay, Google Pay), and 135+ currencies. Stripe is PCI DSS Level 1 certified, the highest level of payment security.",
  ],
  what_is_react: [
    "React is a popular JavaScript library for building user interfaces, created by Meta (Facebook). It uses a component-based architecture where UIs are built from reusable components. NexusAI's frontend is built with React and Next.js, providing fast page loads, SEO optimization, and a smooth user experience.",
  ],
  what_is_nextjs: [
    "Next.js is a React framework for building full-stack web applications. It provides server-side rendering (SSR), static site generation (SSG), API routes, file-based routing, and built-in optimizations. NexusAI uses Next.js for fast page loads, SEO, and seamless frontend-backend integration.",
  ],
  what_is_mongodb: [
    "MongoDB is a popular NoSQL database that stores data in flexible JSON-like documents. Unlike traditional SQL databases, it doesn't require a fixed schema. NexusAI uses MongoDB to store users, products, orders, chat messages, and conversations. It's scalable, flexible, and great for rapid development.",
  ],
  what_is_tailwind: [
    "Tailwind CSS is a utility-first CSS framework that lets you build custom designs quickly by composing utility classes directly in your HTML/JSX. Instead of writing custom CSS, you use classes like `bg-primary-600`, `rounded-xl`, `flex`, `gap-4`. NexusAI uses Tailwind for its clean, responsive design.",
  ],
  types_of_ai: [
    "Main types of AI:\n\n1️⃣ **Narrow AI** - Designed for specific tasks (like me!). Most AI today is narrow AI.\n2️⃣ **General AI (AGI)** - Human-level intelligence across all tasks. Doesn't exist yet.\n3️⃣ **Super AI** - Beyond human intelligence. Theoretical only.\n\nWithin narrow AI:\n- **Machine Learning** - Learning from data\n- **Deep Learning** - Neural networks with many layers\n- **NLP** - Understanding language (like ChatGPT)\n- **Computer Vision** - Understanding images",
  ],
  future_of_ai: [
    "The future of AI includes:\n\n🚀 **Multimodal AI** - Models that understand text, images, audio, video together\n🧬 **AI in Healthcare** - Drug discovery, diagnosis, personalized treatment\n🚗 **Autonomous Systems** - Self-driving cars, drones, robots\n🎨 **Creative AI** - Art, music, video generation\n💼 **AI in Business** - Automation, analytics, decision-making\n🌍 **AI Safety** - Ensuring AI is ethical, safe, and beneficial\n\nThe AI market is expected to reach $1.8 trillion by 2030.",
  ],
  programming_languages: [
    "Most popular programming languages in 2024:\n\n1. **Python** - AI, data science, web development\n2. **JavaScript/TypeScript** - Web development (what NexusAI uses!)\n3. **Java** - Enterprise applications\n4. **C#** - Game development (Unity), enterprise\n5. **Go** - Cloud infrastructure, microservices\n6. **Rust** - Systems programming, performance\n7. **Swift** - iOS/macOS development\n8. **Kotlin** - Android development",
  ],
  web_development: [
    "Modern web development stack:\n\n**Frontend:**\n- React/Next.js (what NexusAI uses!)\n- TypeScript for type safety\n- Tailwind CSS for styling\n- TanStack Query for data fetching\n\n**Backend:**\n- Node.js with Express.js\n- MongoDB for database\n- JWT for authentication\n- Stripe for payments\n\n**Deployment:**\n- Vercel (frontend)\n- AWS/Heroku (backend)\n- MongoDB Atlas (database)",
  ],
  cybersecurity: [
    "Key cybersecurity concepts:\n\n🔒 **Encryption** - Converting data to unreadable format (AES, RSA)\n🔑 **Authentication** - Verifying identity (passwords, biometrics, 2FA)\n🛡️ **Authorization** - Controlling access to resources\n🌐 **HTTPS** - Secure communication protocol\n💳 **PCI DSS** - Payment card security standards\n🔐 **JWT** - JSON Web Tokens for secure API authentication\n\nNexusAI uses all of these to keep your data safe!",
  ],
  cloud_computing: [
    "Cloud computing provides on-demand computing resources over the internet. Major providers:\n\n☁️ **AWS** (Amazon) - Most popular, widest services\n🔷 **Azure** (Microsoft) - Enterprise focused\n🟢 **Google Cloud** - AI/ML focused\n\nServices include: compute (VMs), storage, databases, AI/ML, serverless functions, CDN, and more. NexusAI could be deployed on any of these platforms.",
  ],
  blockchain: [
    "Blockchain is a decentralized, distributed ledger technology. Key features:\n\n📋 **Immutable** - Cannot be changed once recorded\n🔗 **Decentralized** - No single point of control\n transparent** - All transactions visible\n🔒 **Secure** - Cryptographic protection\n\nUses: Cryptocurrency, NFTs, Smart Contracts, Supply Chain, Voting. Not related to NexusAI's current features.",
  ],
  data_science: [
    "Data Science combines statistics, programming, and domain knowledge to extract insights from data. Key tools:\n\n📊 **Python** (Pandas, NumPy, Scikit-learn)\n📈 **R** for statistical analysis\n🤖 **TensorFlow/PyTorch** for deep learning\n📊 **Tableau/Power BI** for visualization\n🗄️ **SQL** for database queries\n\nData Scientists earn $100K-$200K+ in the US.",
  ],
  job_market: [
    "Hot tech jobs in 2024:\n\n🤖 **AI/ML Engineer** - $120K-$200K+\n💻 **Software Engineer** - $100K-$180K\n📊 **Data Scientist** - $100K-$170K\n☁️ **Cloud Engineer** - $110K-$170K\n🔒 **Cybersecurity Analyst** - $90K-$150K\n📱 **Mobile Developer** - $100K-$160K\n🎨 **UX Designer** - $80K-$140K\n\nAI skills command the highest salaries right now!",
  ],
  healthy_tech: [
    "Tips for healthy tech use:\n\n👁️ **20-20-20 Rule** - Every 20 minutes, look at something 20 feet away for 20 seconds\n🪑 **Ergonomic Setup** - Proper chair, desk, and monitor height\n⏰ **Screen Time Limits** - Take breaks every hour\n🌙 **Blue Light** - Use night mode in the evening\n🏃 **Exercise** - Stand and stretch regularly\n😴 **Sleep** - Avoid screens 1 hour before bed",
  ],
};

// ═══════════════════════════════════════════════════════════════
// KEYWORD TO KNOWLEDGE BASE MAPPING
// ═══════════════════════════════════════════════════════════════
const KEYWORD_MAP: Record<string, string> = {
  // How-to guides FIRST (more specific)
  "how to buy|how do i buy|how to purchase|buying guide|purchase guide": "how_to_buy",
  "how to sell|become seller|list.*product|add.*product|sell on|upload.*product": "how_to_sell",
  // Website general
  "nexusai|nexus ai|your website|this platform|this site|your platform": "about_nexusai",
  "what (can|does).*(you|nexusai|this|the site) (do|offer|provide|have)|feature|what are the feature": "features",
  "categor|types of product|what kind of product|what products do you have": "categories",
  "\\bpric|\\bcost|\\bsubscription|\\bplan|\\btier|\\bfree tier|\\bpro plan|\\benterprise plan|how much do": "pricing_info",
  "\\bpay\\b|checkout|stripe|credit card|payment method|how to pay|how do i pay": "payment_info",
  "refund|money back|return policy|cancel order": "refund_policy",
  "contact|\\bemail\\b|\\bphone\\b|reach.*support|support.*contact|help center": "contact_info",
  "chatbot|ai assistant|ai helper|what can you do|who are you|your capability": "ai_chatbot_info",

  // AI & Tech - very specific phrases
  "artificial intelligence|what is ai|\\bdefine ai\\b|\\babout ai\\b|explain ai": "what_is_ai",
  "\\bllm\\b|large language model|chatgpt|claude ai|gemini ai|gpt-4|openai model": "what_is_llm",
  "stripe payment|payment processor|payment gateway|what is stripe": "what_is_stripe",
  "\\breact\\b|reactjs|react js|what is react": "what_is_react",
  "nextjs|next js|next\\.js|what is next": "what_is_nextjs",
  "mongodb|what is mongo|nosql database|what database": "what_is_mongodb",
  "tailwind|tailwindcss|what is tailwind|css framework": "what_is_tailwind",
  "types of ai|kind of ai|ai types|narrow ai|\\bagi\\b|general ai": "types_of_ai",
  "future of ai|ai future|ai prediction|where is ai going|ai in 2030": "future_of_ai",
  "programming language|coding language|which language.*learn|learn coding|learn programming|popular language": "programming_languages",
  "web develop|website develop|full stack|frontend develop|backend develop": "web_development",
  "cybersecurity|cyber security|what is security|internet security|data protection": "cybersecurity",
  "cloud comput|what is cloud|aws\\b|azure\\b|google cloud|hosting": "cloud_computing",
  "blockchain|crypto|bitcoin|ethereum|\\bnft\\b|web3|what is blockchain": "blockchain",
  "data science|machine learning|deep learning|neural network|data analysis": "data_science",
  "tech job|developer job|salary|career.*tech|job market|get a job": "job_market",
  "screen time|healthy.*tech|ergonomic|eye strain|posture|take.*break": "healthy_tech",
};

// ═══════════════════════════════════════════════════════════════
// RESPONSE PATTERNS
// ═══════════════════════════════════════════════════════════════
const RESPONSE_PATTERNS: { pattern: RegExp; handler: (match: RegExpMatchArray) => string }[] = [
  {
    pattern: /^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening)|assalam| salaam)/i,
    handler: () => KNOWLEDGE_BASE.greeting[Math.floor(Math.random() * KNOWLEDGE_BASE.greeting.length)],
  },
  {
    pattern: /thank|thanks|thx|dhonnobad|shukriya/i,
    handler: () => "You're welcome! 😊 Is there anything else I can help you with?",
  },
  {
    pattern: /bye|goodbye|see you|later|alvida/i,
    handler: () => "Goodbye! Thanks for visiting NexusAI. Feel free to come back anytime! 👋",
  },
  {
    pattern: /how are you|how r u|kemon acho|ki khobor/i,
    handler: () => "I'm doing great, thanks for asking! 😊 I'm the NexusAI AI Assistant, always ready to help you find the perfect digital products or answer any questions you have. What can I do for you today?",
  },
  {
    pattern: /who (are|r) you|tumi ke|apni ke|your name/i,
    handler: () => "I'm the **NexusAI AI Assistant**! 🤖 I'm an AI-powered chatbot that helps you:\n\n🔍 Find products on our marketplace\n💡 Get recommendations\n📝 Generate content\n🖼️ Create images\n❓ Answer questions about anything\n\nI have a vast knowledge base covering technology, AI, programming, and much more. I also remember our entire conversation!",
  },
  {
    pattern: /joke|maza|funny|hasao|hasi/i,
    handler: () => "Here's a tech joke for you! 😄\n\nWhy do programmers prefer dark mode?\n\nBecause light attracts bugs! 🐛💡\n\nWant to hear another one, or can I help you find something on NexusAI?",
  },
];

// ═══════════════════════════════════════════════════════════════
// AI SERVICE CLASS
// ═══════════════════════════════════════════════════════════════
class AIService {
  // Main chat handler
  async handleChat(context: ChatContext): Promise<AIResponse> {
    const { userId, conversationId, message } = context;

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

    // Save user message
    await ChatMessage.create({
      conversationId: convId,
      userId,
      role: "user",
      content: message,
    });

    // Get conversation history
    const history = await ChatMessage.find({ conversationId: convId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // Generate response
    const response = await this.generateResponse(message, userId, history.reverse());

    // Save AI response
    await ChatMessage.create({
      conversationId: convId,
      userId,
      role: "assistant",
      content: response.message,
      metadata: response.metadata,
    });

    // Update conversation
    await Conversation.findByIdAndUpdate(convId, {
      lastMessage: response.message.slice(0, 200),
      $inc: { messageCount: 2 },
      title: history.length <= 1 ? message.slice(0, 50) : undefined,
    });

    return { ...response, conversationId: convId! };
  }

  // Generate response
  private async generateResponse(
    message: string,
    userId: string,
    history: any[]
  ): Promise<AIResponse> {
    const lower = message.toLowerCase().trim();

    // 1. Contextual follow-ups
    const ctxResponse = this.handleContextualFollowUp(lower, history);
    if (ctxResponse) return ctxResponse;

    // 2. Pattern matching (greetings, thanks, etc.)
    for (const { pattern, handler } of RESPONSE_PATTERNS) {
      const match = lower.match(pattern);
      if (match) {
        return { message: handler(match), conversationId: "", suggestions: ["Explore Products", "What can you do?", "Tell me about AI"] };
      }
    }

    // 3. Product search (gather context for LLM)
    const searchResult = await this.handleProductSearch(message, userId);
    const productQ = await this.handleProductQuestion(message, userId);

    // 4. If Gemini is available, use LLM with context
    if (genAI) {
      return this.generateLLMResponse(message, userId, history, searchResult, productQ);
    }

    // 5. Fallback to knowledge base + templates
    const kbResponse = this.handleKnowledgeBase(lower);
    if (kbResponse) return kbResponse;
    if (productQ) return productQ;
    if (searchResult) return searchResult;

    return {
      message: this.generateIntelligentFallback(message, history),
      conversationId: "",
      suggestions: ["Search Products", "What can you do?", "Tell me about AI"],
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // LLM RESPONSE GENERATOR (Gemini)
  // ═══════════════════════════════════════════════════════════════
  private async generateLLMResponse(
    message: string,
    userId: string,
    history: any[],
    searchResult: AIResponse | null,
    productQ: AIResponse | null
  ): Promise<AIResponse> {
    try {
      const systemPrompt = `You are the NexusAI AI Assistant — a helpful, friendly, and knowledgeable chatbot for the NexusAI digital product marketplace.

About NexusAI:
- AI-powered marketplace for digital products and tools
- 6 categories: AI Templates, Developer Tools, Content Creation, Data Analytics, Business Tools, Design Assets
- Features: AI chat, content generator, image generator, smart recommendations, Stripe payments
- Free/Pro($29/mo)/Enterprise($99/mo) pricing tiers
- Contact: support@nexusai.com, San Francisco, CA

Your capabilities:
- Search and recommend products from the marketplace
- Answer questions about NexusAI features, pricing, how to buy/sell
- Answer general knowledge questions about AI, technology, programming
- Generate content ideas and suggestions
- Help users navigate the platform

Rules:
- Be concise but helpful (2-4 paragraphs max)
- Use markdown formatting for readability
- If you find relevant products, include them in your response
- Always offer helpful follow-up suggestions
- If you don't know something, say so honestly`;

      const model = genAI!.getGenerativeModel({ model: "gemini-2.0-flash" });

      // Build chat history for Gemini
      const chatHistory: { role: string; parts: { text: string }[] }[] = [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "I understand. I'm the NexusAI AI Assistant, ready to help users with products, recommendations, and questions about the marketplace and technology." }] },
      ];

      // Add conversation history (last 10 messages)
      const recentHistory = history.slice(-10);
      for (const msg of recentHistory) {
        chatHistory.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        });
      }

      // Add product context if found
      let contextNote = "";
      if (productQ?.metadata?.items?.length) {
        const items = productQ.metadata.items;
        contextNote = `\n\n[PRODUCT FOUND: ${items.map((i: any) => `${i.title} - $${i.price} - ${i.description}`).join("; ")}]`;
      } else if (searchResult?.metadata?.items?.length) {
        const items = searchResult.metadata.items;
        contextNote = `\n\n[PRODUCTS FOUND: ${items.map((i: any) => `${i.title} - $${i.price}`).join("; ")}]`;
      }

      const chat = model.startChat({ history: chatHistory });
      const result = await chat.sendMessage(message + contextNote);
      const reply = result.response.text() || "I couldn't generate a response. Please try again.";

      // Determine suggestions based on content
      const suggestions = this.generateSuggestions(message, reply);

      return {
        message: reply,
        conversationId: "",
        suggestions,
        metadata: productQ?.metadata || searchResult?.metadata,
      };
    } catch (error: any) {
      console.error("Gemini error:", error.message);
      // Fall back to template system
      const kbResponse = this.handleKnowledgeBase(message.toLowerCase());
      if (kbResponse) return kbResponse;
      if (productQ) return productQ;
      if (searchResult) return searchResult;
      return {
        message: this.generateIntelligentFallback(message, history),
        conversationId: "",
        suggestions: ["Search Products", "What can you do?", "Tell me about AI"],
      };
    }
  }

  private generateSuggestions(userMessage: string, aiReply: string): string[] {
    const lower = userMessage.toLowerCase();
    if (/product|item|tool|template/.test(lower)) {
      return ["View details", "Find similar", "Compare prices"];
    }
    if (/price|cost|buy|purchase/.test(lower)) {
      return ["View pricing page", "Compare plans", "How to buy?"];
    }
    if (/ai|artificial|machine learning|llm/.test(lower)) {
      return ["AI Tools", "Learn more about AI", "Find AI products"];
    }
    return ["Explore Products", "What can you do?", "Tell me about NexusAI"];
  }

  // ═══════════════════════════════════════════════════════════════
  // KNOWLEDGE BASE HANDLER - Website + External Data
  // ═══════════════════════════════════════════════════════════════
  private handleKnowledgeBase(message: string): AIResponse | null {
    // Check each keyword map entry
    for (const [pattern, kbKey] of Object.entries(KEYWORD_MAP)) {
      const regex = new RegExp(pattern, "i");
      if (regex.test(message)) {
        const responses = KNOWLEDGE_BASE[kbKey];
        if (responses && responses.length > 0) {
          const answer = responses[Math.floor(Math.random() * responses.length)];
          const suggestions = this.getRelatedSuggestions(kbKey);
          return { message: answer, conversationId: "", suggestions };
        }
      }
    }

    // Direct knowledge base key lookup
    for (const [key, responses] of Object.entries(KNOWLEDGE_BASE)) {
      if (message.includes(key.replace(/_/g, " ")) || message.includes(key.replace(/_/g, ""))) {
        return { message: responses[0], conversationId: "", suggestions: ["Search Products", "Tell me more"] };
      }
    }

    return null;
  }

  private getRelatedSuggestions(kbKey: string): string[] {
    const suggestionMap: Record<string, string[]> = {
      about_nexusai: ["Show me products", "How to buy?", "AI Chatbot"],
      features: ["AI Content Generator", "AI Image Generator", "Recommendations"],
      categories: ["AI Templates", "Developer Tools", "Content Creation"],
      pricing_info: ["How to buy?", "Show free products", "Enterprise plan"],
      payment_info: ["Refund policy", "How to buy?", "Is it secure?"],
      refund_policy: ["Contact support", "My orders", "Payment info"],
      contact_info: ["About NexusAI", "Features", "Help center"],
      how_to_buy: ["Show products", "Payment info", "Refund policy"],
      how_to_sell: ["Dashboard", "Add item", "Manage items"],
      ai_chatbot_info: ["Search products", "Generate content", "Create images"],
      what_is_ai: ["Types of AI", "Future of AI", "AI Tools on NexusAI"],
      what_is_llm: ["AI Tools on NexusAI", "What is AI?", "ChatGPT alternatives"],
      what_is_stripe: ["Payment info", "Is it secure?", "How to buy?"],
      programming_languages: ["Web development", "Learn coding", "Tech jobs"],
      web_development: ["React", "Next.js", "Tailwind CSS"],
      cybersecurity: ["Is NexusAI secure?", "Privacy policy", "Data protection"],
      cloud_computing: ["How is NexusAI deployed?", "Scalability", "AWS"],
      data_science: ["Data Analytics tools", "Machine learning", "AI"],
      job_market: ["Salary", "Learn programming", "AI jobs"],
    };
    return suggestionMap[kbKey] || ["Search Products", "What can you do?"];
  }

  // ═══════════════════════════════════════════════════════════════
  // CONTEXTUAL FOLLOW-UP HANDLER
  // ═══════════════════════════════════════════════════════════════
  private handleContextualFollowUp(message: string, history: any[]): AIResponse | null {
    if (history.length === 0) return null;
    const lastAI = history.filter((m) => m.role === "assistant").slice(-1)[0];
    if (!lastAI) return null;
    const last = lastAI.content.toLowerCase();

    // Yes/confirm
    if (/^(yes|yeah|yep|sure|ok|okay|ha|ji|thik|acha|yup|ya|of course|please|koren|koro)$/i.test(message)) {
      if (last.includes("found") && last.includes("product")) {
        const products = last.match(/\*\*(.+?)\*\*/g);
        if (products) {
          const names = products.map((p: string) => p.replace(/\*\*/g, ""));
          return {
            message: `Here are the products I found:\n\n${names.map((n: string, i: number) => `${i + 1}. **${n}**`).join("\n")}\n\nWhat would you like to do?\n- Say **"Tell me about [name]"** for details\n- Say **"Find [keyword]"** to search more\n- Say **"Price of [name]"** for pricing`,
            conversationId: "",
            suggestions: names.slice(0, 3).map((n: string) => `Tell me about ${n}`),
          };
        }
      }
      if (last.includes("would you like") || last.includes("can i help")) {
        return {
          message: "Sure! I'm here to help. What would you like to do?\n\n🔍 Search for products\n💡 Get recommendations\n📝 Generate content\n🖼️ Create images\n❓ Ask me anything",
          conversationId: "",
          suggestions: ["Search products", "AI Content Generator", "What can you do?"],
        };
      }
    }

    // No/decline
    if (/^(no|nah|nope|nai|nahi|na)$/i.test(message)) {
      return {
        message: "No problem! Let me know if you need anything else. 😊",
        conversationId: "",
        suggestions: ["Search products", "Help me find something", "What can you do?"],
      };
    }

    // Tell me about X
    const aboutMatch = message.match(/(?:tell me about|more about|details? of?|info about|describe|what is|what's)\s+(.+)/i);
    if (aboutMatch) {
      const query = aboutMatch[1].trim();
      // Will be handled by handleProductQuestion
    }

    // Thanks
    if (/thank|thanks|thx|dhonnobad/i.test(message)) {
      return {
        message: "You're welcome! 😊 Is there anything else I can help you with?",
        conversationId: "",
        suggestions: ["Search more products", "AI Content Generator", "What can you do?"],
      };
    }

    return null;
  }

  // ═══════════════════════════════════════════════════════════════
  // PRODUCT SEARCH
  // ═══════════════════════════════════════════════════════════════
  private async handleProductSearch(message: string, userId: string): Promise<AIResponse | null> {
    const lower = message.toLowerCase();

    // Skip if it's a question about something specific
    if (/^(tell me about|what is|what's|describe|details? of|info about|features of)/i.test(lower)) {
      return null;
    }

    const searchIntents = /find|search|look for|show me|looking for|want|need|buy|get|suggest|recommend|any|give me|help me find|what do you have|what products|show all|list|check out|browse|explore|any good|what are the best/i;
    if (!searchIntents.test(lower)) return null;

    const stopWords = new Set([
      "find", "me", "search", "look", "for", "show", "want", "to", "need", "buy", "get",
      "please", "can", "you", "could", "i", "some", "any", "give", "help", "us",
      "what", "do", "have", "products", "list", "all", "about", "that", "the",
      "a", "an", "and", "or", "but", "is", "are", "was", "with", "from", "like",
      "just", "really", "very", "also", "too", "now", "right", "something", "things",
      "one", "ones", "new", "best", "good", "great", "top", "popular", "some",
    ]);

    const keywords = lower
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 2 && !stopWords.has(w));

    if (keywords.length === 0) return null;

    try {
      const searchConditions = keywords.flatMap((kw) => [
        { title: { $regex: kw, $options: "i" } },
        { description: { $regex: kw, $options: "i" } },
        { tags: { $regex: kw, $options: "i" } },
        { category: { $regex: kw, $options: "i" } },
      ]);

      const items = await Item.find({ status: "active", $or: searchConditions })
        .sort({ rating: -1, downloads: -1 })
        .limit(6)
        .lean();

      if (items.length > 0) {
        const list = items.map((item) =>
          `• **${item.title}** - $${item.price} ⭐${item.rating} (${item.reviewCount} reviews)`
        ).join("\n");

        return {
          message: `I found ${items.length} products for "${keywords.join(" ")}":\n\n${list}\n\nWould you like more details about any of these?`,
          conversationId: "",
          suggestions: items.slice(0, 3).map((i) => `Tell me about ${i.title}`),
          metadata: { action: "search", items, confidence: 0.85 },
        };
      } else {
        const popular = await Item.find({ status: "active" })
          .sort({ rating: -1, downloads: -1 })
          .limit(5)
          .lean();

        const popularList = popular.map((item) =>
          `• **${item.title}** - $${item.price} ⭐${item.rating}`
        ).join("\n");

        return {
          message: `No exact matches for "${keywords.join(" ")}", but here are our top products:\n\n${popularList}\n\nWant me to try a different search?`,
          conversationId: "",
          suggestions: ["Search AI templates", "Search developer tools", "Browse categories"],
          metadata: { action: "search_popular", items: popular, confidence: 0.6 },
        };
      }
    } catch {
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // PRODUCT QUESTION HANDLER
  // ═══════════════════════════════════════════════════════════════
  private async handleProductQuestion(message: string, userId: string): Promise<AIResponse | null> {
    const questionPatterns = /tell me about|what is|what's|describe|details? of?|info about|features? of|how much is|price of|price for/i;
    if (!questionPatterns.test(message)) return null;

    const query = message
      .replace(/tell me about|what is|what's|describe|details? of?|info about|features? of|how much is|price of|price for|the|this|that|product|please|can you|could you/gi, "")
      .trim();

    if (query.length < 2) return null;

    try {
      const item = await Item.findOne({
        status: "active",
        $or: [
          { title: { $regex: query, $options: "i" } },
          { slug: { $regex: query, $options: "i" } },
          { tags: { $regex: query, $options: "i" } },
        ],
      }).lean();

      if (item) {
        const specs = item.specifications.map((s) => `• ${s.key}: ${s.value}`).join("\n");
        return {
          message: `Here are the details for **${item.title}**:\n\n📝 **Description**: ${item.description}\n\n💰 **Price**: $${item.price}${item.originalPrice ? ` (was $${item.originalPrice})` : ""}\n\n⭐ **Rating**: ${item.rating}/5 (${item.reviewCount} reviews)\n\n📥 **Downloads**: ${item.downloads.toLocaleString()}\n\n📂 **Category**: ${item.category}\n\n🏷️ **Tags**: ${item.tags.join(", ")}\n\n${specs ? `📋 **Specifications**:\n${specs}` : ""}\n\nWould you like to purchase this or see similar products?`,
          conversationId: "",
          suggestions: ["Buy this product", `Find similar to ${item.title}`, "Search more products"],
          metadata: { action: "product_info", items: [item], confidence: 0.95 },
        };
      }
    } catch {
      return null;
    }

    return null;
  }

  // ═══════════════════════════════════════════════════════════════
  // INTELLIGENT FALLBACK
  // ═══════════════════════════════════════════════════════════════
  private generateIntelligentFallback(message: string, history: any[]): string {
    const lower = message.toLowerCase();

    if (message.split(" ").length < 3) {
      return `I'm not quite sure what you mean by "${message}". Could you tell me more?\n\nHere's what I can help with:\n\n🔍 **"Find [products]"** - Search our marketplace\n💡 **"Tell me about [product]"** - Get product details\n💰 **"How much is [product]"** - Check pricing\n📝 **"Write a blog about [topic]"** - Generate content\n🌐 **"What is AI?"** - Ask general questions\n\nWhat would you like to explore?`;
    }

    if (message.includes("?")) {
      return `Great question! I'll do my best to help.\n\nI can answer questions about:\n\n🏪 **NexusAI** - Features, pricing, how to buy/sell\n🤖 **AI & Tech** - Artificial intelligence, LLMs, programming\n💻 **Web Development** - React, Next.js, databases\n🔒 **Security** - Encryption, privacy, data protection\n💼 **Career** - Tech jobs, salaries, learning paths\n\nOr I can help you find products on our marketplace!\n\nWhat would you like to know?`;
    }

    return `Thanks for your message! I'm here to help. Here are some things I can do:\n\n🔍 **Find Products** - "Find AI templates"\n💡 **Product Info** - "Tell me about [product name]"\n💰 **Pricing** - "How much is [product]"\n📝 **Content Gen** - "Write a blog about AI"\n🖼️ **Image Gen** - "Create an image of..."\n🌐 **General Knowledge** - "What is machine learning?"\n\nWhat would you like to explore?`;
  }

  // ═══════════════════════════════════════════════════════════════
  // AI CONTENT GENERATOR
  // ═══════════════════════════════════════════════════════════════
  async generateContent(params: {
    type: string;
    topic: string;
    tone: string;
    length: string;
    additionalInfo?: string;
  }): Promise<string> {
    const { type, topic, tone, length, additionalInfo } = params;

    if (genAI) {
      try {
        const lengthMap: Record<string, string> = {
          short: "200-300 words",
          medium: "500-700 words",
          long: "1000-1500 words",
        };

        const typePrompts: Record<string, string> = {
          blog: `Write a blog post about "${topic}". Use markdown formatting with headers, bullet points, and bold text. Make it engaging and informative.`,
          "product-description": `Write a compelling product description for "${topic}". Include features, benefits, and a call to action. Use markdown.`,
          "social-media": `Create social media posts (Twitter, Instagram, LinkedIn) about "${topic}". Include relevant hashtags and emojis.`,
          email: `Write a marketing email campaign about "${topic}". Include subject line, body, and call to action. Use markdown.`,
          documentation: `Write technical documentation for "${topic}". Include overview, getting started, API reference, and examples. Use markdown with code blocks.`,
        };

        const prompt = `You are a professional content writer for NexusAI, an AI-powered digital product marketplace. Write high-quality, engaging content. Use markdown formatting. Tone: ${tone}. Length: ${lengthMap[length] || lengthMap.medium}. ${additionalInfo ? `Additional context: ${additionalInfo}` : ""}\n\n${typePrompts[type] || typePrompts.blog}`;

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const response = result.response.text();

        return response || this.generateFallbackContent(type, topic, tone, length);
      } catch (error: any) {
        console.error("Gemini content generation error:", error.message);
      }
    }

    return this.generateFallbackContent(type, topic, tone, length);
  }

  private generateFallbackContent(type: string, topic: string, tone: string, length: string): string {
    const generators: Record<string, (t: string, tn: string) => string> = {
      blog: (t, tn) => this.generateBlogPost(t, tn, length),
      "product-description": (t, tn) => this.generateProductDescription(t, tn),
      "social-media": (t, tn) => this.generateSocialMediaPost(t, tn),
      email: (t, tn) => this.generateEmailContent(t, tn),
      documentation: (t, tn) => this.generateDocumentation(t, tn),
    };
    return (generators[type] || generators.blog)(topic, tone);
  }

  private generateBlogPost(topic: string, tone: string, length: string): string {
    const paras = length === "short" ? 3 : length === "medium" ? 5 : 8;
    return `# ${topic}

## Introduction

In today's rapidly evolving digital landscape, ${topic.toLowerCase()} has become an essential consideration for businesses and individuals alike. This comprehensive guide explores the key aspects, benefits, and practical applications you need to know.

## Understanding ${topic}

${topic} represents a significant advancement in how we approach digital solutions. By leveraging modern technologies and best practices, organizations can unlock tremendous value and stay ahead of the competition.

### Key Benefits

1. **Enhanced Efficiency** - Streamlined processes lead to faster results and reduced costs
2. **Scalability** - Solutions that grow with your needs, from startup to enterprise
3. **Innovation** - Cutting-edge approaches that keep you at the forefront
4. **Cost-Effectiveness** - Maximum ROI with optimized resource allocation

## Practical Applications

### Use Case 1: Enterprise Integration
Organizations implementing ${topic.toLowerCase()} have seen up to 40% improvement in operational efficiency. The key is strategic planning and phased implementation.

### Use Case 2: Small Business Adoption
Even small businesses can benefit from ${topic.toLowerCase()}. Starting with core features and expanding gradually ensures sustainable growth.

## Best Practices

1. **Start Small** - Begin with a proof of concept before scaling
2. **Measure Results** - Track KPIs to demonstrate value
3. **Iterate** - Continuously improve based on feedback
4. **Stay Updated** - Keep up with the latest developments

## Conclusion

${topic} is transforming industries and creating new opportunities. By understanding its potential and implementing it strategically, you can position yourself for success in the digital age.

---

*Ready to get started? Explore our marketplace for tools and resources.*`;
  }

  private generateProductDescription(topic: string, tone: string): string {
    return `# ${topic}

## Overview

Discover the power of ${topic.toLowerCase()} - a revolutionary solution designed to transform your workflow and boost productivity.

## Key Features

🚀 **Lightning Fast** - Process and analyze data at unprecedented speeds
🎯 **Precision Engineered** - Achieve accurate results consistently
🔧 **Easy Integration** - Seamlessly connects with your existing tools
📊 **Advanced Analytics** - Gain deep insights with comprehensive reporting
🔒 **Enterprise Security** - Bank-level encryption and security protocols

## What's Included

- Full access to all premium features
- Regular updates and improvements
- Priority customer support
- Detailed documentation and tutorials

## Perfect For

- **Professionals** seeking enhanced productivity
- **Teams** looking for collaborative solutions
- **Businesses** wanting to streamline operations

---

*Transform your workflow today.*`;
  }

  private generateSocialMediaPost(topic: string, tone: string): string {
    return `# Social Media Content for ${topic}

## Twitter/X

🚀 ${topic} is changing the game! Here's what you need to know:
✅ Increased efficiency by 40%
✅ Seamless integration
✅ Enterprise-grade security
Ready to level up? #${topic.replace(/\s+/g, "")} #AI #Innovation

## Instagram

Level up your game with ${topic}! 🚀✨
The future of digital transformation is here.
#${topic.replace(/\s+/g, "")} #Tech #Innovation

## LinkedIn

We're excited to share our insights on ${topic}! 🌟
Key trends shaping the future of this space.
#${topic.replace(/\s+/g, "")} #BusinessGrowth #DigitalStrategy`;
  }

  private generateEmailContent(topic: string, tone: string): string {
    return `# Email Campaign: ${topic}

**Subject**: Introducing ${topic} - Transform Your Workflow 🚀

Hi {{first_name}},

We're thrilled to introduce our latest solution for ${topic.toLowerCase()}.

**What makes it different?**
✅ AI-powered automation
✅ Intuitive user interface
✅ Seamless integrations
✅ Enterprise-grade security

**Early Adopter Special**: Get 30% off with code EARLY30

Ready to transform your workflow?

[Get Started Now →]

Best regards,
The NexusAI Team`;
  }

  private generateDocumentation(topic: string, tone: string): string {
    return `# ${topic} - Documentation

## Overview
${topic} is a powerful solution designed to streamline your workflow.

## Getting Started

### Installation
\`\`\`bash
npm install @nexusai/${topic.toLowerCase().replace(/\s+/g, "-")}
\`\`\`

### Basic Usage
\`\`\`javascript
const nexusai = require('@nexusai/${topic.toLowerCase().replace(/\s+/g, "-")}');
const result = await nexusai.init();
\`\`\`

## API Reference

### initialize()
Initialize the ${topic} client.

### process()
Process data with ${topic}.

## Support
Contact support@nexusai.com for help.`;
  }

  // ═══════════════════════════════════════════════════════════════
  // RECOMMENDATIONS
  // ═══════════════════════════════════════════════════════════════
  async getRecommendations(userId: string, limit: number = 5, filters?: { category?: string; minPrice?: number; maxPrice?: number; sort?: string }): Promise<any[]> {
    const user = await User.findById(userId).lean();
    const query: any = { status: "active" };
    if (filters?.category) query.category = filters.category;
    if (filters?.minPrice || filters?.maxPrice) {
      query.price = {};
      if (filters.minPrice) query.price.$gte = filters.minPrice;
      if (filters.maxPrice) query.price.$lte = filters.maxPrice;
    }

    const allItems = await Item.find(query).lean();

    if (!user || allItems.length === 0) {
      return Item.find({ status: "active", featured: true })
        .sort({ rating: -1, downloads: -1 })
        .limit(limit)
        .lean();
    }

    const scoredItems = allItems.map((item) => {
      let score = 0;
      if (user.preferences?.categories?.includes(item.category)) score += 30;
      const priceRange = user.preferences?.priceRange;
      if (priceRange && item.price >= priceRange.min && item.price <= priceRange.max) score += 20;
      score += item.rating * 5;
      score += Math.min(item.downloads / 100, 15);
      if (user.savedItems?.some((id) => id.toString() === item._id.toString())) score += 25;
      return { ...item, score };
    });

    let sorted = scoredItems.sort((a, b) => b.score - a.score);

    if (filters?.sort === "price-low") sorted = scoredItems.sort((a, b) => a.price - b.price);
    else if (filters?.sort === "price-high") sorted = scoredItems.sort((a, b) => b.price - a.price);
    else if (filters?.sort === "rating") sorted = scoredItems.sort((a, b) => b.rating - a.rating);

    return sorted.slice(0, limit);
  }
}

export const aiService = new AIService();
