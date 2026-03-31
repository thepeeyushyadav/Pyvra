"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { pricingCards } from "@/lib/constants";
import { useModal } from "@/providers/modal-provider";
import { Plan } from "@prisma/client";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Loading from "@/components/global/loading";
import SubscriptionForm from ".";

type Props = {
  customerId: string;
  planExists: boolean;
};

type RazorpayOrderState = {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
};

const SubscriptionFormWrapper = ({ customerId, planExists }: Props) => {
  const { data, setClose } = useModal();
  const router = useRouter();
  const [selectedPriceId, setSelectedPriceId] = useState<Plan | "">(
    data?.plans?.defaultPriceId || ""
  );

  const [order, setOrder] = useState<RazorpayOrderState>({
    orderId: "",
    amount: 0,
    currency: "INR",
    keyId: "",
  });

  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  useEffect(() => {
    if (!selectedPriceId) return;

    const createOrder = async () => {
      setIsCreatingOrder(true);
      try {
        // Derive the amount from the selected price card
        const priceCard = pricingCards.find(
          (p: any) => p.priceId === selectedPriceId
        );
        // price is stored as "$0" or "$49" in constants — strip "$" and parse
        const rawPrice = priceCard?.price?.replace(/[^0-9.]/g, "") ?? "0";
        const amount = parseFloat(rawPrice) || 0;

        const orderResponse = await fetch("/api/razorpay/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerId,
            priceId: selectedPriceId,
            amount,
            currency: "INR",
          }),
        });

        const orderData = await orderResponse.json();

        if (!orderResponse.ok) {
          throw new Error(orderData.error || "Failed to create order");
        }

        setOrder({
          orderId: orderData.orderId,
          amount: orderData.amount,
          currency: orderData.currency,
          keyId: orderData.keyId,
        });

        if (planExists) {
          toast({
            title: "Success",
            description: "Your plan has been successfully upgraded!",
          });
          setClose();
          router.refresh();
        }
      } catch (err) {
        console.error("🔴 Failed to create Razorpay order", err);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not initialize payment. Please try again.",
        });
      } finally {
        setIsCreatingOrder(false);
      }
    };

    createOrder();
  }, [data, selectedPriceId, customerId]);

  return (
    <div className="border-none transition-all">
      <div className="flex flex-col gap-4">
        {data.plans?.plans.map((price: any) => (
          <Card
            onClick={() => setSelectedPriceId(price.id as Plan)}
            key={price.id}
            className={clsx("relative cursor-pointer transition-all", {
              "border-primary": selectedPriceId === price.id,
            })}
          >
            <CardHeader>
              <CardTitle>
                ₹{price.unit_amount ? price.unit_amount / 100 : "0"}
                <p className="text-sm text-muted-foreground">
                  {price.nickname}
                </p>
                <p className="text-sm text-muted-foreground">
                  {
                    pricingCards.find((p: any) => p.priceId === price.id)
                      ?.description
                  }
                </p>
              </CardTitle>
            </CardHeader>
            {selectedPriceId === price.id && (
              <div className="w-2 h-2 bg-emerald-500 rounded-full absolute top-4 right-4" />
            )}
          </Card>
        ))}

        {order.orderId && !planExists && (
          <>
            <h1 className="text-xl">Payment Method</h1>
            <SubscriptionForm
              selectedPriceId={selectedPriceId}
              orderId={order.orderId}
              amount={order.amount}
              currency={order.currency}
              keyId={order.keyId}
              customerId={customerId}
            />
          </>
        )}

        {isCreatingOrder && selectedPriceId && (
          <div className="flex items-center justify-center w-full h-40">
            <Loading />
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionFormWrapper;
