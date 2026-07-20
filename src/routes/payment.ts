import { Router } from "express";
import express from "express";
import { paymentController } from "../controllers/paymentController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/create-checkout", authenticate, paymentController.createCheckout);
router.post("/webhook", express.raw({ type: "application/json" }), paymentController.webhook);
router.get("/orders", authenticate, paymentController.getMyOrders);

export default router;
