import { razorpay } from "@/lib/razorpay/index";
import { NextResponse } from "next/server";

/**
 * POST /api/razorpay/create-order
 *
 * Replaces /api/stripe/create-subscription.
 * Creates a Razorpay order and returns order details + public key for the
 * frontend Checkout modal.
 *
 * Body: { customerId: string; priceId: string; amount: number; currency?: string }
 * Returns: { orderId, amount, currency, keyId }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customerId, priceId, amount, currency = "INR" } = body;

    if (!customerId || !priceId || !amount) {
      return NextResponse.json(
        { error: "customerId, priceId and amount are required" },
        { status: 400 }
      );
    }

    const order = await razorpay.orders.create({
      amount: Math.round(Number(amount) * 100), // Razorpay expects paise
      currency,
      notes: {
        customerId,
        priceId,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID ?? "",
    });
  } catch (error: any) {
    console.error("🔴 Razorpay create-order error", error);
    return NextResponse.json(
      { error: error?.message || error?.description || "Internal Error" },
      { status: 500 }
    );
  }
}
