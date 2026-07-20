import Stripe from "stripe";
import { config } from "../config";

let stripeInstance: Stripe | null = null;

function getStripe(): Stripe | null {
  if (stripeInstance) return stripeInstance;

  if (
    config.stripeSecretKey &&
    config.stripeSecretKey !== "sk_test_your_stripe_key" &&
    config.stripeSecretKey.startsWith("sk_")
  ) {
    stripeInstance = new Stripe(config.stripeSecretKey, {
      apiVersion: "2024-04-10" as any,
    });
  }

  return stripeInstance;
}

export const stripeService = {
  async createCheckoutSession(
    items: { itemId: string; title: string; price: number; quantity: number }[],
    userId: string,
    successUrl: string,
    cancelUrl: string
  ) {
    const stripe = getStripe();
    if (!stripe) {
      throw new Error("Stripe is not configured. Use demo mode.");
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: items.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.title,
            metadata: { itemId: item.itemId },
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId },
    });

    return session;
  },

  async createPaymentIntent(amount: number, currency: string = "usd", metadata: Record<string, string> = {}) {
    const stripe = getStripe();
    if (!stripe) throw new Error("Stripe not configured");

    return stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata,
    });
  },

  constructWebhookEvent(body: Buffer, signature: string) {
    const stripe = getStripe();
    if (!stripe) throw new Error("Stripe not configured");
    return stripe.webhooks.constructEvent(body, signature, config.stripeWebhookSecret);
  },

  async createCustomer(email: string, name: string) {
    const stripe = getStripe();
    if (!stripe) throw new Error("Stripe not configured");
    return stripe.customers.create({ email, name });
  },
};
