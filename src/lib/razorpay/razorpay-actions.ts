import { db } from "../db";
import { razorpay } from ".";
import { Plan } from "@prisma/client";
import crypto from "crypto";

// ─── Subscription Created ────────────────────────────────────────────────────
// Called after verifying a successful Razorpay payment to upsert the subscription.
export const subscriptionCreated = async (
  customerId: string,
  priceId: string,
  razorpayPaymentId: string,
  planEndDate: Date
) => {
  try {
    const agency = await db.agency.findFirst({
      where: { customerId },
      include: { Subscription: true },
    });

    if (!agency) {
      throw new Error("Could not find an agency to upsert the subscription");
    }

    const data = {
      active: true,
      agencyId: agency.id,
      customerId,
      currentPeriodEndDate: planEndDate,
      priceId,
      subscritiptionId: razorpayPaymentId,
      plan: priceId as keyof typeof Plan,
    };

    const res = await db.subscription.upsert({
      where: { agencyId: agency.id },
      create: data,
      update: data,
    });

    console.log(`🟢 Created/Updated Subscription for payment ${razorpayPaymentId}`);
    return res;
  } catch (error) {
    console.log("🔴 Error from subscriptionCreated action", error);
  }
};

// ─── Get Connect Account Products ────────────────────────────────────────────
// Razorpay Route doesn't expose a product catalog via API. Return empty array
// to maintain interface compatibility with any callers.
export const getConnectAccountProducts = async (
  razorpayAccountId: string
): Promise<any[]> => {
  console.log(
    `ℹ️ getConnectAccountProducts: Razorpay does not expose a product list API. Account: ${razorpayAccountId}`
  );
  return [];
};

// ─── Verify Razorpay Signature ───────────────────────────────────────────────
// Utility to verify HMAC SHA256 signature sent by Razorpay after payment.
export const verifyRazorpaySignature = (
  orderId: string,
  paymentId: string,
  signature: string
): boolean => {
  const keySecret = process.env.RAZORPAY_KEY_SECRET ?? "";
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(body)
    .digest("hex");
  return expectedSignature === signature;
};
