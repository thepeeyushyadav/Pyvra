import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/lib/db";
import { CheckCircleIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type Props = {
  params: Promise<{
    agencyId: string;
  }>;
  searchParams: Promise<{
    code: string;
  }>;
};

/**
 * Verify Razorpay credentials by calling the Razorpay API directly on the server.
 */
async function verifyRazorpayKeys(): Promise<{
  verified: boolean;
  keyId?: string;
}> {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return { verified: false };
    }

    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/payments?count=1", {
      headers: { Authorization: `Basic ${credentials}` },
      cache: "no-store",
    });

    if (response.ok) {
      return { verified: true, keyId };
    }

    return { verified: false };
  } catch {
    return { verified: false };
  }
}

const Page = async ({ params }: Props) => {
  const { agencyId } = await params;

  const agencyDetails = await db.agency.findUnique({
    where: { id: agencyId },
  });

  if (!agencyDetails) return;

  const allDetailsExist =
    agencyDetails.address &&
    agencyDetails.agencyLogo &&
    agencyDetails.city &&
    agencyDetails.companyEmail &&
    agencyDetails.companyPhone &&
    agencyDetails.country &&
    agencyDetails.name &&
    agencyDetails.state &&
    agencyDetails.zipCode;

  // Verify Razorpay keys by making a real API call
  const razorpayStatus = await verifyRazorpayKeys();

  // Persist verified status so other parts of the app can check it
  if (razorpayStatus.verified && !agencyDetails.connectAccountId) {
    await db.agency.update({
      where: { id: agencyId },
      data: { connectAccountId: razorpayStatus.keyId || "razorpay_verified" },
    });
  }

  return (
    <div className="flex flex-col justify-center items-center">
      <div className="w-full h-full">
        <Card className="border-none w-full">
          <CardHeader>
            <CardTitle>Lets get started!</CardTitle>
            <CardDescription>
              Follow the steps below to get your account setup.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/* Step 1 — Save website shortcut */}
            <div className="flex justify-between items-center w-full border p-4 rounded-lg gap-2">
              <div className="flex md:items-center gap-4 flex-col md:!flex-row">
                <Image
                  src="/appstore.png"
                  alt="app logo"
                  height={80}
                  width={80}
                  className="rounded-md object-contain"
                />
                <p>Save the website as a shortcut on your mobile device</p>
              </div>
            </div>

            {/* Step 2 — Razorpay verification */}
            <div className="flex justify-between items-center w-full border p-4 rounded-lg gap-2">
              <div className="flex md:items-center gap-4 flex-col md:!flex-row">
                <div className="flex items-center justify-center h-[80px] w-[80px] rounded-md bg-blue-600/10 text-blue-500 font-bold text-lg flex-shrink-0">
                  RZP
                </div>
                <div>
                  {razorpayStatus.verified ? (
                    <>
                      <p className="font-medium text-emerald-500">
                        Razorpay Verified
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Your payment gateway is active and ready to collect
                        payments.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium">
                        Connect your Razorpay account
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Your Razorpay payment gateway is not connected yet.
                        Please contact the administrator to complete the setup.
                      </p>
                    </>
                  )}
                </div>
              </div>
              {razorpayStatus.verified ? (
                <CheckCircleIcon
                  size={50}
                  className="text-emerald-500 p-2 flex-shrink-0"
                />
              ) : (
                <Link
                  className="bg-primary py-2 px-4 rounded-md text-white whitespace-nowrap"
                  href="https://dashboard.razorpay.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Setup
                </Link>
              )}
            </div>

            {/* Step 3 — Business details */}
            <div className="flex justify-between items-center w-full border p-4 rounded-lg gap-2">
              <div className="flex md:items-center gap-4 flex-col md:!flex-row">
                <Image
                  src={agencyDetails.agencyLogo}
                  alt="agency logo"
                  height={80}
                  width={80}
                  className="rounded-md object-contain"
                  unoptimized
                />
                <p>Fill in all your business details</p>
              </div>
              {allDetailsExist ? (
                <CheckCircleIcon
                  size={50}
                  className="text-emerald-500 p-2 flex-shrink-0"
                />
              ) : (
                <Link
                  className="bg-primary py-2 px-4 rounded-md text-white"
                  href={`/agency/${agencyId}/settings`}
                >
                  Start
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Page;
