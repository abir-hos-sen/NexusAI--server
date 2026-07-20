import { Router } from "express";
import { chatController } from "../controllers/chatController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/", authenticate, chatController.sendMessage);
router.post("/stream", authenticate, chatController.streamMessage);
router.get("/conversations", authenticate, chatController.getConversations);
router.get("/conversations/:conversationId", authenticate, chatController.getConversationMessages);
router.delete("/conversations/:conversationId", authenticate, chatController.deleteConversation);
router.post("/generate-content", authenticate, chatController.generateContent);
router.post("/generate-image", authenticate, chatController.generateImage);
router.get("/recommendations", authenticate, chatController.getRecommendations);

export default router;
