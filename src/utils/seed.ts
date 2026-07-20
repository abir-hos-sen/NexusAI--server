import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { Item, Category, User } from "../models";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const categories = [
  { name: "AI Templates", slug: "ai-templates", description: "Pre-built prompts and workflow templates", icon: "🤖", itemCount: 0 },
  { name: "Developer Tools", slug: "developer-tools", description: "APIs, SDKs, and code utilities", icon: "🔧", itemCount: 0 },
  { name: "Content Creation", slug: "content-creation", description: "Writing, image, and video tools", icon: "✏️", itemCount: 0 },
  { name: "Data Analytics", slug: "data-analytics", description: "Data analysis and visualization", icon: "📊", itemCount: 0 },
  { name: "Business Tools", slug: "business-tools", description: "Automation and productivity", icon: "💼", itemCount: 0 },
  { name: "Design Assets", slug: "design-assets", description: "UI kits, icons, and templates", icon: "🎨", itemCount: 0 },
];

const demoUser = {
  name: "Demo User",
  email: "demo@nexusai.com",
  password: "demo123456",
  role: "user" as const,
  bio: "Digital product enthusiast and AI tools explorer.",
  location: "San Francisco, CA",
};

const adminUser = {
  name: "Admin",
  email: "admin@nexusai.com",
  password: "admin123456",
  role: "admin" as const,
  bio: "NexusAI Platform Administrator",
};

const items = [
  {
    title: "AI Content Master",
    slug: "ai-content-master",
    description: "Generate blog posts, articles, and marketing copy with advanced AI. Includes 50+ prompt templates.",
    fullDescription: "AI Content Master is a comprehensive content generation toolkit that leverages cutting-edge language models to create high-quality written content. Perfect for bloggers, marketers, and content creators who need consistent, engaging content at scale.\n\nFeatures:\n- 50+ pre-built prompt templates\n- Custom tone and style settings\n- SEO optimization suggestions\n- Multi-language support\n- Batch generation mode",
    price: 29.99,
    originalPrice: 49.99,
    category: "AI Templates",
    tags: ["content", "blog", "marketing", "writing", "ai"],
    images: ["https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800"],
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400",
    rating: 4.8,
    reviewCount: 234,
    downloads: 1520,
    featured: true,
    aiGenerated: false,
    metaInfo: { format: "JSON/Prompt Pack", size: "2.5 MB", compatibility: "All AI platforms", version: "3.2", lastUpdated: new Date() },
    specifications: [
      { key: "Templates", value: "50+" },
      { key: "Languages", value: "12" },
      { key: "Updates", value: "Free for 1 year" },
    ],
  },
  {
    title: "CodePilot Pro",
    slug: "codepilot-pro",
    description: "AI-powered code assistant with multi-language support. Generate, refactor, and debug code instantly.",
    fullDescription: "CodePilot Pro is an advanced AI coding assistant that helps developers write better code faster. It supports 20+ programming languages and integrates with popular IDEs.\n\nFeatures:\n- Code generation from natural language\n- Automatic refactoring suggestions\n- Bug detection and fix recommendations\n- Documentation generation\n- Test case creation",
    price: 49.99,
    originalPrice: 79.99,
    category: "Developer Tools",
    tags: ["coding", "development", "programming", "ai", "ide"],
    images: ["https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800"],
    thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400",
    rating: 4.9,
    reviewCount: 189,
    downloads: 2340,
    featured: true,
    aiGenerated: false,
    metaInfo: { format: "IDE Extension", size: "15 MB", compatibility: "VS Code, JetBrains", version: "2.1", lastUpdated: new Date() },
    specifications: [
      { key: "Languages", value: "20+" },
      { key: "IDE Support", value: "VS Code, JetBrains" },
      { key: "API Access", value: "Included" },
    ],
  },
  {
    title: "DataViz AI Dashboard",
    slug: "dataviz-ai-dashboard",
    description: "Transform raw data into stunning visualizations with AI-powered insights and recommendations.",
    fullDescription: "DataViz AI Dashboard is a powerful analytics tool that automatically creates beautiful charts, graphs, and dashboards from your data. The AI engine analyzes your data patterns and suggests the best visualizations.\n\nFeatures:\n- Automatic chart type selection\n- Real-time data streaming\n- Export to PNG, PDF, SVG\n- Custom themes and branding\n- Collaborative dashboards",
    price: 39.99,
    originalPrice: 59.99,
    category: "Data Analytics",
    tags: ["data", "visualization", "charts", "dashboard", "analytics"],
    images: ["https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800"],
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400",
    rating: 4.7,
    reviewCount: 156,
    downloads: 980,
    featured: true,
    aiGenerated: false,
    metaInfo: { format: "Web App", size: "50 MB", compatibility: "All browsers", version: "4.0", lastUpdated: new Date() },
    specifications: [
      { key: "Data Sources", value: "CSV, JSON, SQL, API" },
      { key: "Chart Types", value: "30+" },
      { key: "Real-time", value: "Yes" },
    ],
  },
  {
    title: "Social Media AI Suite",
    slug: "social-media-ai-suite",
    description: "Plan, create, and schedule social media content across all platforms with AI assistance.",
    fullDescription: "Social Media AI Suite is your all-in-one solution for social media management. It uses AI to create engaging posts, suggest optimal posting times, and analyze performance.\n\nFeatures:\n- Multi-platform scheduling\n- AI content suggestions\n- Hashtag optimization\n- Analytics and reporting\n- Team collaboration tools",
    price: 24.99,
    originalPrice: 39.99,
    category: "Content Creation",
    tags: ["social media", "marketing", "scheduling", "content", "analytics"],
    images: ["https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800"],
    thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400",
    rating: 4.6,
    reviewCount: 312,
    downloads: 2100,
    featured: true,
    aiGenerated: false,
    metaInfo: { format: "SaaS", size: "Web-based", compatibility: "All platforms", version: "5.1", lastUpdated: new Date() },
    specifications: [
      { key: "Platforms", value: "Instagram, Twitter, LinkedIn, TikTok" },
      { key: "Scheduling", value: "Unlimited" },
      { key: "Team Members", value: "Up to 5" },
    ],
  },
  {
    title: "InvoiceFlow AI",
    slug: "invoiceflow-ai",
    description: "Automate invoicing, expense tracking, and financial reporting with intelligent AI.",
    fullDescription: "InvoiceFlow AI revolutionizes your financial workflow. It automatically categorizes expenses, generates professional invoices, and provides AI-powered financial insights.\n\nFeatures:\n- Smart invoice generation\n- Expense auto-categorization\n- Financial forecasting\n- Tax preparation assistance\n- Integration with 50+ payment gateways",
    price: 34.99,
    originalPrice: 54.99,
    category: "Business Tools",
    tags: ["finance", "invoice", "accounting", "business", "automation"],
    images: ["https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800"],
    thumbnail: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400",
    rating: 4.5,
    reviewCount: 198,
    downloads: 1340,
    featured: true,
    aiGenerated: false,
    metaInfo: { format: "Web App + Mobile", size: "25 MB", compatibility: "iOS, Android, Web", version: "3.0", lastUpdated: new Date() },
    specifications: [
      { key: "Currencies", value: "100+" },
      { key: "Payment Gateways", value: "50+" },
      { key: "Users", value: "Unlimited" },
    ],
  },
  {
    title: "DesignMind UI Kit",
    slug: "designmind-ui-kit",
    description: "Beautiful, AI-curated UI components and design systems for modern web applications.",
    fullDescription: "DesignMind UI Kit is a comprehensive design system with 500+ components, 100+ page templates, and AI-powered design suggestions. Create stunning interfaces in minutes.\n\nFeatures:\n- 500+ React components\n- 100+ page templates\n- Dark/Light mode\n- Figma source files\n- Tailwind CSS support",
    price: 44.99,
    originalPrice: 69.99,
    category: "Design Assets",
    tags: ["design", "ui", "components", "figma", "react"],
    images: ["https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800"],
    thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400",
    rating: 4.8,
    reviewCount: 267,
    downloads: 1890,
    featured: true,
    aiGenerated: false,
    metaInfo: { format: "React + Figma", size: "120 MB", compatibility: "React, Vue, HTML", version: "2.5", lastUpdated: new Date() },
    specifications: [
      { key: "Components", value: "500+" },
      { key: "Templates", value: "100+" },
      { key: "Frameworks", value: "React, Vue, HTML" },
    ],
  },
  {
    title: "PromptForge Collection",
    slug: "promptforge-collection",
    description: "Curated collection of 200+ expert prompts for ChatGPT, Claude, and Gemini.",
    fullDescription: "PromptForge Collection is the ultimate prompt library for AI enthusiasts and professionals. Each prompt is tested, optimized, and categorized for maximum effectiveness.\n\nFeatures:\n- 200+ expert prompts\n- Multi-model compatibility\n- Category-based organization\n- Custom prompt builder\n- Performance ratings",
    price: 19.99,
    originalPrice: 29.99,
    category: "AI Templates",
    tags: ["prompts", "chatgpt", "claude", "gemini", "ai"],
    images: ["https://images.unsplash.com/photo-1684163761883-8cba5e060cd3?w=800"],
    thumbnail: "https://images.unsplash.com/photo-1684163761883-8cba5e060cd3?w=400",
    rating: 4.7,
    reviewCount: 445,
    downloads: 3200,
    featured: false,
    aiGenerated: false,
    metaInfo: { format: "PDF + Notion", size: "8 MB", compatibility: "All AI platforms", version: "4.0", lastUpdated: new Date() },
    specifications: [
      { key: "Prompts", value: "200+" },
      { key: "Categories", value: "15" },
      { key: "Updates", value: "Monthly" },
    ],
  },
  {
    title: "API Gateway Shield",
    slug: "api-gateway-shield",
    description: "Protect and optimize your APIs with AI-powered rate limiting, caching, and threat detection.",
    fullDescription: "API Gateway Shield provides enterprise-grade API protection with intelligent features. It uses ML to detect anomalies, optimize caching, and prevent abuse.\n\nFeatures:\n- AI threat detection\n- Smart rate limiting\n- Response caching\n- Analytics dashboard\n- SDK for Node.js, Python, Go",
    price: 59.99,
    originalPrice: 99.99,
    category: "Developer Tools",
    tags: ["api", "security", "gateway", "developer", "devops"],
    images: ["https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800"],
    thumbnail: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400",
    rating: 4.9,
    reviewCount: 134,
    downloads: 890,
    featured: false,
    aiGenerated: false,
    metaInfo: { format: "Cloud Service", size: "N/A", compatibility: "All platforms", version: "1.5", lastUpdated: new Date() },
    specifications: [
      { key: "Rate Limit", value: "Configurable" },
      { key: "Cache TTL", value: "Auto-optimized" },
      { key: "SDKs", value: "Node.js, Python, Go" },
    ],
  },
  {
    title: "BrandVoice AI",
    slug: "brandvoice-ai",
    description: "Create consistent brand messaging across all channels with AI-powered content strategy.",
    fullDescription: "BrandVoice AI helps businesses maintain a consistent brand voice across all content channels. It analyzes your existing content, creates style guides, and generates on-brand content.\n\nFeatures:\n- Brand voice analysis\n- Style guide generation\n- Content consistency scoring\n- Multi-channel publishing\n- A/B testing suggestions",
    price: 44.99,
    originalPrice: 64.99,
    category: "Content Creation",
    tags: ["branding", "content", "marketing", "copywriting", "ai"],
    images: ["https://images.unsplash.com/photo-1553484771-047044b78b03?w=800"],
    thumbnail: "https://images.unsplash.com/photo-1553484771-047044b78b03?w=400",
    rating: 4.6,
    reviewCount: 178,
    downloads: 1120,
    featured: false,
    aiGenerated: false,
    metaInfo: { format: "SaaS", size: "Web-based", compatibility: "All platforms", version: "2.0", lastUpdated: new Date() },
    specifications: [
      { key: "Languages", value: "15" },
      { key: "Channels", value: "Email, Social, Web, Print" },
      { key: "Team Size", value: "Unlimited" },
    ],
  },
  {
    title: "ML Pipeline Builder",
    slug: "ml-pipeline-builder",
    description: "Build and deploy ML pipelines visually with drag-and-drop components and auto-scaling.",
    fullDescription: "ML Pipeline Builder democratizes machine learning by providing a visual, no-code interface for building complex ML pipelines. Connect data sources, train models, and deploy to production.\n\nFeatures:\n- Visual pipeline builder\n- 50+ ML components\n- Auto-scaling infrastructure\n- Model versioning\n- One-click deployment",
    price: 79.99,
    originalPrice: 129.99,
    category: "Data Analytics",
    tags: ["machine learning", "data", "pipeline", "mlops", "ai"],
    images: ["https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800"],
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400",
    rating: 4.8,
    reviewCount: 98,
    downloads: 670,
    featured: false,
    aiGenerated: false,
    metaInfo: { format: "Cloud Platform", size: "N/A", compatibility: "AWS, GCP, Azure", version: "3.0", lastUpdated: new Date() },
    specifications: [
      { key: "ML Components", value: "50+" },
      { key: "Cloud Support", value: "AWS, GCP, Azure" },
      { key: "Auto-scaling", value: "Yes" },
    ],
  },
  {
    title: "WorkflowAutomate Pro",
    slug: "workflowautomate-pro",
    description: "Connect 500+ apps and automate repetitive tasks with AI-powered workflow builder.",
    fullDescription: "WorkflowAutomate Pro is a powerful automation platform that connects your favorite apps and creates intelligent workflows. No coding required.\n\nFeatures:\n- 500+ app integrations\n- AI-trigger suggestions\n- Conditional logic\n- Error handling\n- Webhook support",
    price: 29.99,
    originalPrice: 44.99,
    category: "Business Tools",
    tags: ["automation", "workflow", "integration", "productivity", "no-code"],
    images: ["https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800"],
    thumbnail: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=400",
    rating: 4.5,
    reviewCount: 289,
    downloads: 2450,
    featured: false,
    aiGenerated: false,
    metaInfo: { format: "SaaS", size: "Web-based", compatibility: "All platforms", version: "4.2", lastUpdated: new Date() },
    specifications: [
      { key: "Integrations", value: "500+" },
      { key: "Workflows", value: "Unlimited" },
      { key: "Executions", value: "10,000/month" },
    ],
  },
  {
    title: "PixelPerfect AI",
    slug: "pixelperfect-ai",
    description: "Generate stunning product images, icons, and illustrations with AI image generation.",
    fullDescription: "PixelPerfect AI uses advanced AI to generate professional product images, custom icons, and illustrations. Perfect for e-commerce, marketing, and design.\n\nFeatures:\n- Text-to-image generation\n- Background removal\n- Style transfer\n- Batch processing\n- Custom model training",
    price: 34.99,
    originalPrice: 54.99,
    category: "Design Assets",
    tags: ["images", "design", "ai", "graphics", "illustration"],
    images: ["https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800"],
    thumbnail: "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400",
    rating: 4.7,
    reviewCount: 356,
    downloads: 2780,
    featured: false,
    aiGenerated: false,
    metaInfo: { format: "Web App + API", size: "N/A", compatibility: "All platforms", version: "2.8", lastUpdated: new Date() },
    specifications: [
      { key: "Resolution", value: "Up to 4K" },
      { key: "Styles", value: "50+" },
      { key: "API Access", value: "Included" },
    ],
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/nexusai");
    console.log("Connected to MongoDB");

    // Clear existing data
    await Promise.all([
      Category.deleteMany({}),
      Item.deleteMany({}),
      User.deleteMany({ email: { $in: ["demo@nexusai.com", "admin@nexusai.com"] } }),
    ]);

    // Create users
    const demoUserDoc = await User.create(demoUser);
    const adminUserDoc = await User.create(adminUser);
    console.log("Users created");

    // Create categories
    const createdCategories = await Category.insertMany(categories);
    console.log("Categories created");

    // Create items
    const itemsWithSellers = items.map((item, i) => ({
      ...item,
      seller: i % 2 === 0 ? demoUserDoc._id : adminUserDoc._id,
    }));

    const createdItems = await Item.insertMany(itemsWithSellers);
    console.log(`${createdItems.length} items created`);

    // Update category item counts
    for (const cat of createdCategories) {
      const count = createdItems.filter((item) => item.category === cat.name).length;
      await Category.findByIdAndUpdate(cat._id, { itemCount: count });
    }

    console.log("Seed completed successfully!");
    console.log("\nDemo credentials:");
    console.log("Email: demo@nexusai.com | Password: demo123456");
    console.log("Admin: admin@nexusai.com | Password: admin123456");

    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
}

seed();
