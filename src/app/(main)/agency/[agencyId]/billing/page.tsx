import { addOnProducts, pricingCards } from "@/lib/constants";
import { db } from "@/lib/db";
import PricingCard from "./_components/pricing-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import clsx from "clsx";

type Props = {
  params: Promise<{
    agencyId: string;
  }>;
};

const Page = async ({ params }: Props) => {
  const { agencyId } = await params;

  const agencySubscription = await db.agency.findUnique({
    where: { id: agencyId },
    select: {
      customerId: true,
      Subscription: true,
    },
  });

  const currentPlanDetails = pricingCards.find(
    (c) => c.priceId === agencySubscription?.Subscription?.priceId
  );

  // Build a prices list from local pricingCards constants (Razorpay pricing is managed locally)
  const prices = pricingCards
    .filter((p) => p.priceId)
    .map((p) => ({
      id: p.priceId,
      unit_amount: p.price
        ? Math.round(parseFloat(p.price.replace(/[^0-9.]/g, "")) * 100)
        : 0,
      nickname: p.title,
      currency: "inr",
    }));

  // Build an addOns list from local addOnProducts constants
  const addOns = addOnProducts.map((product) => ({
    id: product.id,
    name: product.title ?? "Add-on",
    default_price: {
      unit_amount: null as number | null,
    },
  }));

  // Payment history from DB (orders stored after verify-payment)
  const subscriptionHistory = agencySubscription?.Subscription
    ? [
        {
          id: agencySubscription.Subscription.subscritiptionId ?? "—",
          description: agencySubscription.Subscription.plan ?? "Subscription",
          date: agencySubscription.Subscription.currentPeriodEndDate
            ? `Renews ${new Date(agencySubscription.Subscription.currentPeriodEndDate).toLocaleDateString()}`
            : "—",
          status: agencySubscription.Subscription.active ? "Paid" : "Inactive",
          amount: agencySubscription.Subscription.priceId
            ? (
                pricingCards.find(
                  (p) => p.priceId === agencySubscription.Subscription?.priceId
                )?.price ?? "$0"
              )
            : "$0",
        },
      ]
    : [];

  return (
    <>
      <h1 className="text-4xl p-4">Billing</h1>
      <h2 className="text-2xl p-4">Current Plan</h2>
      <div className="flex flex-col lg:!flex-row justify-between gap-8">
        <PricingCard
          planExists={agencySubscription?.Subscription?.active === true}
          prices={prices}
          customerId={agencySubscription?.customerId || ""}
          amt={
            agencySubscription?.Subscription?.active === true
              ? currentPlanDetails?.price || "$0"
              : "$0"
          }
          buttonCta={
            agencySubscription?.Subscription?.active === true
              ? "Change Plan"
              : "Get Started"
          }
          highlightDescription="Want to modify your plan? You can do this here. If you have
                    further question contact support@pyvra-app.com"
          highlightTitle="Plan Options"
          description={
            agencySubscription?.Subscription?.active === true
              ? currentPlanDetails?.description || "Lets get started"
              : "Lets get started! Pick a plan that works best for you."
          }
          duration="/ month"
          features={
            agencySubscription?.Subscription?.active === true
              ? currentPlanDetails?.features || []
              : currentPlanDetails?.features ||
                pricingCards.find((pricing) => pricing.title === "Starter")
                  ?.features ||
                []
          }
          title={
            agencySubscription?.Subscription?.active === true
              ? currentPlanDetails?.title || "Starter"
              : "Starter"
          }
        />
        {addOns.map((addOn) => (
          <PricingCard
            planExists={agencySubscription?.Subscription?.active === true}
            prices={prices}
            customerId={agencySubscription?.customerId || ""}
            key={addOn.id}
            amt={
              addOn.default_price?.unit_amount
                ? `$${addOn.default_price.unit_amount / 100}`
                : "$0"
            }
            buttonCta="Subscribe"
            description="Dedicated support line & teams channel for support"
            duration="/ month"
            features={[]}
            title={"24/7 priority support"}
            highlightTitle="Get support now!"
            highlightDescription="Get priority support and skip the long wait with the click of a button."
          />
        ))}
      </div>
      <h2 className="text-2xl p-4">Payment History</h2>
      <Table className="bg-card border-[1px] border-border rounded-md">
        <TableHeader className="rounded-md">
          <TableRow>
            <TableHead className="w-[200px]">Description</TableHead>
            <TableHead className="w-[200px]">Payment ID</TableHead>
            <TableHead className="w-[300px]">Date</TableHead>
            <TableHead className="w-[200px]">Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="font-medium truncate">
          {subscriptionHistory.map((charge) => (
            <TableRow key={charge.id}>
              <TableCell>{String(charge.description)}</TableCell>
              <TableCell className="text-muted-foreground">
                {charge.id}
              </TableCell>
              <TableCell>{charge.date}</TableCell>
              <TableCell>
                <p
                  className={clsx("", {
                    "text-emerald-500":
                      charge.status.toLowerCase() === "paid",
                    "text-orange-600":
                      charge.status.toLowerCase() === "pending",
                    "text-red-600": charge.status.toLowerCase() === "failed",
                  })}
                >
                  {charge.status.toUpperCase()}
                </p>
              </TableCell>
              <TableCell className="text-right">{String(charge.amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
};

export default Page;
