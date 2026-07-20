import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { stripeService } from "../services/stripeService";
import { Order, Item } from "../models";
import { config } from "../config";

const isStripeConfigured = () => {
  return (
    config.stripeSecretKey &&
    config.stripeSecretKey !== "sk_test_your_stripe_key" &&
    config.stripeSecretKey.startsWith("sk_")
  );
};

export const paymentController = {
  async createCheckout(req: AuthRequest, res: Response) {
    try {
      const { items } = req.body;
      const userId = req.user?._id;

      if (!items || items.length === 0) {
        return res.status(400).json({ success: false, message: "No items provided" });
      }

      // Fetch items from DB to verify prices
      const itemIds = items.map((i: any) => i.itemId);
      const dbItems = await Item.find({ _id: { $in: itemIds } });

      const checkoutItems = items.map((item: any) => {
        const dbItem = dbItems.find((d) => d._id.toString() === item.itemId);
        return {
          itemId: item.itemId,
          title: dbItem?.title || item.title,
          price: dbItem?.price || item.price,
          quantity: item.quantity || 1,
        };
      });

      const totalAmount = checkoutItems.reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
        0
      );

      // Create order
      const order = await Order.create({
        userId,
        items: checkoutItems,
        totalAmount,
        status: "pending",
      });

      // If Stripe is not configured, use demo mode
      if (!isStripeConfigured()) {
        // Demo mode: immediately mark as completed
        order.status = "completed";
        order.stripePaymentIntentId = "demo_" + Date.now();
        await order.save();

        // Increment download counts
        for (const item of checkoutItems) {
          await Item.findByIdAndUpdate(item.itemId, { $inc: { downloads: 1 } });
        }

        return res.json({
          success: true,
          demo: true,
          message: "Demo payment successful! (Stripe not configured)",
          sessionId: "demo_session_" + Date.now(),
          sessionUrl: null,
          orderId: order._id,
        });
      }

      // Real Stripe checkout
      const session = await stripeService.createCheckoutSession(
        checkoutItems,
        userId!.toString(),
        `${config.clientUrl}/dashboard?success=true`,
        `${config.clientUrl}/explore`
      );

      res.json({
        success: true,
        sessionId: session.id,
        sessionUrl: session.url,
        orderId: order._id,
      });
    } catch (error: any) {
      console.error("Payment error:", error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async webhook(req: any, res: any) {
    try {
      const sig = req.headers["stripe-signature"];
      if (!sig) {
        return res.status(400).json({ success: false, message: "Missing stripe-signature header" });
      }
      const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
      const event = stripeService.constructWebhookEvent(rawBody, sig);

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as any;
        const order = await Order.findOne({ _id: session.metadata?.orderId });

        if (order) {
          order.status = "completed";
          order.stripePaymentIntentId = session.payment_intent;
          await order.save();
        }
      }

      res.json({ received: true });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async getMyOrders(req: AuthRequest, res: Response) {
    try {
      const orders = await Order.find({ userId: req.user?._id })
        .sort({ createdAt: -1 })
        .populate("items.itemId")
        .lean();

      res.json({ success: true, orders });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
