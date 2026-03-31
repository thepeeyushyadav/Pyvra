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

  // Razorpay does not use an OAuth Connect flow like Stripe.
  // Agencies configure their Razorpay Key ID directly in their account settings.
  const hasRazorpayConfigured = Boolean(agencyDetails.connectAccountId);

  return (
    <div className="flex flex-col justify-center items-center">
      <div className="w-full h-full max-x-[800px]">
        <Card className="border-none">
          <CardHeader>
            <CardTitle>Lets get started</CardTitle>
            <CardDescription>
              Follow the steps below to get your account setup
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex justify-between items-center w-full border p-4 rounded-lg gap-2">
              <div className="flex md:items-center gap-4 flex-col md:!flex-row">
                <Image
                  src="/appstore.png"
                  alt="app logo"
                  height={80}
                  width={80}
                  className="rounded-md object-contain"
                />
                <p> Save the website as a shortcut on your mobile device</p>
              </div>
            </div>

            <div className="flex justify-between items-center w-full border p-4 rounded-lg gap-2">
              <div className="flex md:items-center gap-4 flex-col md:!flex-row">
                {/* Razorpay logo — use a placeholder since stripelogo.png is Stripe */}
                <div className="flex items-center justify-center h-[80px] w-[80px] rounded-md bg-primary/10 text-primary font-bold text-lg">
                  RZP
                </div>
                <div>
                  <p className="font-medium">Configure your Razorpay account</p>
                  <p className="text-sm text-muted-foreground">
                    Visit the{" "}
                    <a
                      href="https://dashboard.razorpay.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-primary"
                    >
                      Razorpay Dashboard
                    </a>{" "}
                    to get your Key ID &amp; Key Secret, then add them to your{" "}
                    <code>.env</code> file as{" "}
                    <code>RAZORPAY_KEY_ID</code> and{" "}
                    <code>RAZORPAY_KEY_SECRET</code>.
                  </p>
                </div>
              </div>
              {hasRazorpayConfigured ? (
                <CheckCircleIcon
                  size={50}
                  className="text-primary p-2 flex-shrink-0"
                />
              ) : (
                <Link
                  className="bg-primary py-2 px-4 rounded-md text-white whitespace-nowrap"
                  href="https://dashboard.razorpay.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open Dashboard
                </Link>
              )}
            </div>

            <div className="flex justify-between items-center w-full border p-4 rounded-lg gap-2">
              <div className="flex md:items-center gap-4 flex-col md:!flex-row">
                <Image
                  src={agencyDetails.agencyLogo}
                  alt="app logo"
                  height={80}
                  width={80}
                  className="rounded-md object-contain"
                />
                <p> Fill in all your bussiness details</p>
              </div>
              {allDetailsExist ? (
                <CheckCircleIcon
                  size={50}
                  className="text-primary p-2 flex-shrink-0"
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
