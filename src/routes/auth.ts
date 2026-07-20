import { Router } from "express";
import { authController } from "../controllers/authController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/google", authController.googleLogin);
router.post("/logout", authController.logout);
router.get("/me", authenticate, authController.getMe);
router.put("/profile", authenticate, authController.updateProfile);
router.put("/save-item/:itemId", authenticate, authController.toggleSaveItem);

export default router;
