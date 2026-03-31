"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Plan } from "@prisma/client";
import { loadRazorpayScript } from "@/lib/razorpay/razorpay-client";
import React, { useState } from "react";

type Props = {
  selectedPriceId: string | Plan;
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  customerId: string;
};

const SubscriptionForm = ({
  selectedPriceId,
  orderId,
  amount,
  currency,
  keyId,
  customerId,
}: Props) => {
  const { toast } = useToast();
  const [priceError, setPriceError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedPriceId) {
      setPriceError("You need to select a plan to subscribe.");
      return;
    }
    if (!orderId) {
      setPriceError("Payment order is not ready yet. Please wait.");
      return;
    }

    setPriceError("");
    setIsLoading(true);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Razorpay SDK failed to load.");
      }

      await new Promise<void>((resolve, reject) => {
        const options = {
          key: keyId,
          amount,
          currency,
          order_id: orderId,
          name: "Pyvra App",
          description: "Subscription Payment",
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              const verifyRes = await fetch("/api/razorpay/verify-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  customerId,
                  priceId: selectedPriceId,
                }),
              });

              if (!verifyRes.ok) throw new Error("Payment verification failed.");
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          prefill: {},
          theme: { color: "#6c47ff" },
          modal: {
            ondismiss: () => reject(new Error("Payment modal closed")),
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      });

      toast({
        title: "Payment successful",
        description: "Your payment has been successfully processed.",
      });
    } catch (error: any) {
      if (error?.message !== "Payment modal closed") {
        toast({
          variant: "destructive",
          title: "Payment failed",
          description:
            "We couldn't process your payment. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <small className="text-destructive">{priceError}</small>
      <Button
        type="submit"
        disabled={isLoading || !orderId}
        className="mt-4 w-full"
      >
        {isLoading ? "Processing..." : "Pay Now"}
      </Button>
    </form>
  );
};

export default SubscriptionForm;
