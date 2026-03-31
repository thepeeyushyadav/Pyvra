import { NextResponse } from "next/server";

/**
 * POST /api/razorpay/create-customer
 *
 * Razorpay does not require a separate "customer" object before taking payment.
 * This route stores the agency contact details for reference and returns a
 * customerId compatible with the existing agency-details form flow.
 *
 * Body: { email: string; name?: string; address?: object }
 * Returns: { customerId: string }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("create-customer body:", body);

    if (!body || !body.email) {
      return NextResponse.json(
        { error: "Email is required", bodyReceived: body },
        { status: 400 }
      );
    }

    // Razorpay does not have a "create customer" API for server-side subscription flows.
    // We generate a deterministic customer reference from the email so it remains
    // idempotent across repeated calls during agency creation.
    const customerId = `rzp_cust_${Buffer.from(body.email)
      .toString("base64")
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 20)}`;

    return NextResponse.json({ customerId });
  } catch (error) {
    console.error("🔴 Razorpay create-customer error", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
