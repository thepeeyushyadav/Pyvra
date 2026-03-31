import BlurPage from "@/components/global/blur-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { CheckCircleIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

type Props = {
    searchParams: Promise<{
        state: string;
        code: string;
    }>;
    params: Promise<{ subaccountId: string }>;
};

const Page = async (props: Props) => {
    const params = await props.params;
    const searchParams = (await props.searchParams);
    const subAccountDetails = await db.subAccount.findUnique({
        where: {
            id: params.subaccountId,
        },
    });

    if (!subAccountDetails) {
        return;
    }

    const allDetailsExist = subAccountDetails.address && subAccountDetails.subAccountLogo && subAccountDetails.city && subAccountDetails.companyEmail && subAccountDetails.companyPhone && subAccountDetails.country && subAccountDetails.name && subAccountDetails.state;

    // Razorpay does not use an OAuth Connect flow like Stripe.
    // Sub-accounts configure their Razorpay Key ID manually in account settings.
    const hasRazorpayConfigured = Boolean(subAccountDetails.connectAccountId);

    return (
        <BlurPage>
            <div className="flex flex-col justify-center items-center">
                <div className="w-full h-full max-w-[800px]">
                    <Card className="border-none ">
                        <CardHeader>
                            <CardTitle>Lets get started!</CardTitle>
                            <CardDescription>Follow the steps below to get your account setup correctly.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="flex justify-between items-center w-full h-20 border p-4 rounded-lg ">
                                <div className="flex items-center gap-4">
                                    <Image src="/appstore.png" alt="App logo" height={80} width={80} className="rounded-md object-contain" />
                                    <p>Save the website as a shortcut on your mobile device</p>
                                </div>
                                <Button>Start</Button>
                            </div>
                            <div className="flex justify-between items-center w-full border p-4 rounded-lg gap-2">
                                <div className="flex items-center gap-4">
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
                                            to get your Key ID, then add it to your account settings.
                                        </p>
                                    </div>
                                </div>
                                {hasRazorpayConfigured ? (
                                    <CheckCircleIcon size={50} className="text-primary p-2 flex-shrink-0" />
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
                            <div className="flex justify-between items-center w-full h-20 border p-4 rounded-lg">
                                <div className="flex items-center gap-4">
                                    <Image src={subAccountDetails.subAccountLogo} alt="App logo" height={80} width={80} className="rounded-md object-contain p-4" />
                                    <p>Fill in all your business details.</p>
                                </div>
                                {allDetailsExist ? (
                                    <CheckCircleIcon size={50} className=" text-primary p-2 flex-shrink-0" />
                                ) : (
                                    <Link className="bg-primary py-2 px-4 rounded-md text-white" href={`/subaccount/${subAccountDetails.id}/settings`}>
                                        Start
                                    </Link>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </BlurPage>
    );
};

export default Page;
