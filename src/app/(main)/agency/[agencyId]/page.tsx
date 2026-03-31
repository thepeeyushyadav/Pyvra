import { db } from "@/lib/db";
import { pricingCards } from "@/lib/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  CreditCard,
  Rocket,
  Settings,
  LayoutDashboard,
  Shield,
  Database,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import LogoImage from "@/components/global/logo-image";

type Props = {
  params: Promise<{ agencyId: string }>;
};

const Page = async ({ params }: Props) => {
  const { agencyId } = await params;

  const agency = await db.agency.findUnique({
    where: { id: agencyId },
    include: {
      SubAccount: true,
      Subscription: true,
    },
  });

  if (!agency) return null;

  const currentPlan = pricingCards.find(
    (c) => c.priceId === agency.Subscription?.priceId
  );

  const subAccountCount = agency.SubAccount.length;
  const isSubscribed = agency.Subscription?.active === true;

  const quickLinks = [
    {
      label: "Launchpad",
      href: `/agency/${agencyId}/launchpad`,
      icon: Rocket,
      description: "Set up your account",
    },
    {
      label: "Sub Accounts",
      href: `/agency/${agencyId}/all-subaccounts`,
      icon: Users,
      description: `${subAccountCount} account${subAccountCount !== 1 ? "s" : ""}`,
    },
    {
      label: "Billing",
      href: `/agency/${agencyId}/billing`,
      icon: CreditCard,
      description: isSubscribed ? currentPlan?.title ?? "Active" : "No plan",
    },
    {
      label: "Team",
      href: `/agency/${agencyId}/team`,
      icon: Shield,
      description: "Manage members",
    },
    {
      label: "Media",
      href: `/agency/${agencyId}/media`,
      icon: Database,
      description: "Your media library",
    },
    {
      label: "Settings",
      href: `/agency/${agencyId}/settings`,
      icon: Settings,
      description: "Agency configuration",
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <LogoImage
          src={agency.agencyLogo}
          alt={agency.name}
          width={56}
          height={56}
          className="rounded-xl object-contain border border-border bg-card p-1"
        />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{agency.name}</h1>
            <Badge variant={isSubscribed ? "default" : "secondary"}>
              {isSubscribed ? currentPlan?.title ?? "Active" : "Free"}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {agency.companyEmail} &bull; {agency.city}, {agency.state}
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sub Accounts</CardDescription>
            <CardTitle className="text-4xl">{subAccountCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Active client accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Current Plan</CardDescription>
            <CardTitle className="text-2xl">
              {isSubscribed ? currentPlan?.title ?? "Active" : "No Plan"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {isSubscribed
                ? currentPlan?.price
                  ? `${currentPlan.price} / month`
                  : "Active subscription"
                : "Upgrade in Billing"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Subscription Status</CardDescription>
            <CardTitle className="text-2xl">
              {isSubscribed ? "Active" : "Inactive"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {agency.Subscription?.currentPeriodEndDate
                ? `Renews ${new Date(
                    agency.Subscription.currentPeriodEndDate
                  ).toLocaleDateString()}`
                : "No active subscription"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation */}
      <div>
        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5" />
          Quick Navigation
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {quickLinks.map(({ label, href, icon: Icon, description }) => (
            <Link key={href} href={href}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-primary" />
                    <CardTitle className="text-base">{label}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Page;
