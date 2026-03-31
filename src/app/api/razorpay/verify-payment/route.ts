import { NextResponse } from "next/server";
import { verifyRazorpaySignature, subscriptionCreated } from "@/lib/razorpay/razorpay-actions";

/**
 * POST /api/razorpay/verify-payment
 *
 * Verifies the HMAC signature sent by Razorpay on successful payment and
 * upserts the subscription record in the database.
 *
 * Body:
 *  razorpay_order_id    – returned by Razorpay after payment
 *  razorpay_payment_id  – returned by Razorpay after payment
 *  razorpay_signature   – HMAC SHA256 signature to verify
 *  customerId           – internal customer identifier
 *  priceId              – the plan / price that was purchased
 *
 * Returns: { success: true } | { success: false, error: string }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      customerId,
      priceId,
    } = body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !customerId ||
      !priceId
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Subscription period: 30 days from now (adjust to match your plan cycle)
    const planEndDate = new Date();
    planEndDate.setDate(planEndDate.getDate() + 30);

    await subscriptionCreated(
      customerId,
      priceId,
      razorpay_payment_id,
      planEndDate
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("🔴 Razorpay verify-payment error", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
