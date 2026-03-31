import { NextResponse } from "next/server";

/**
 * GET /api/razorpay/verify-keys
 *
 * Verifies that the RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET env vars are
 * valid by making a real API call to Razorpay (fetching payments with limit 1).
 * Returns { verified: true/false }.
 */
export async function GET() {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json({
        verified: false,
        reason: "RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing from environment variables.",
      });
    }

    // Make a real API call to Razorpay to verify the credentials
    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/payments?count=1", {
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    });

    if (response.ok) {
      return NextResponse.json({ verified: true, keyId });
    }

    const errorData = await response.json().catch(() => ({}));
    return NextResponse.json({
      verified: false,
      reason: errorData?.error?.description || `Razorpay API returned ${response.status}`,
    });
  } catch (error: any) {
    console.error("🔴 Razorpay verify-keys error:", error);
    return NextResponse.json({
      verified: false,
      reason: error?.message || "Failed to connect to Razorpay API.",
    });
  }
}
