"use client";
import Loading from "@/components/global/loading";
import { toast } from "@/components/ui/use-toast";
import { EditorBtns } from "@/lib/constants";
import { getFunnel, getSubAccountDetails } from "@/lib/queries";
import { loadRazorpayScript } from "@/lib/razorpay/razorpay-client";
import { EditorElement, useEditor } from "@/providers/editor/editor-provider";
import clsx from "clsx";
import { Badge, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

type Props = {
    element: EditorElement;
};

const Checkout = ({ element }: Props) => {
    const { state, dispatch, subaccountId, funnelId } = useEditor();
    const { styles, id } = element;
    const router = useRouter();
    const [livePrices, setLivePrices] = useState([]);
    const [subAccountConnectAccId, setSubAccountConnectAccId] = useState("");
    const [orderReady, setOrderReady] = useState(false);

    useEffect(() => {
        if (!subaccountId) return;
        const fetchData = async () => {
            const subaccountDetails = await getSubAccountDetails(subaccountId);
            if (subaccountDetails) {
                if (!subaccountDetails.connectAccountId) return;
                setSubAccountConnectAccId(subaccountDetails.connectAccountId);
            }
        };
        fetchData();
    }, [subaccountId]);

    useEffect(() => {
        if (funnelId) {
            const fetchData = async () => {
                const funnelData = await getFunnel(funnelId);
                setLivePrices(JSON.parse(funnelData?.liveProducts || "[]"));
            };
            fetchData();
        }
    }, [funnelId]);

    useEffect(() => {
        if (livePrices.length && subaccountId && subAccountConnectAccId) {
            // Pre-load Razorpay script so the checkout modal opens instantly on click
            loadRazorpayScript().then((loaded) => {
                setOrderReady(loaded);
                if (!loaded) {
                    toast({
                        className: "z-[100000]",
                        variant: "destructive",
                        title: "Error",
                        description: "Could not load Razorpay checkout. Please check your internet connection.",
                    });
                }
            });
        }
    }, [livePrices, subaccountId, subAccountConnectAccId]);

    const handleDragStart = (e: React.DragEvent, type: EditorBtns) => {
        if (type === null) return;
        e.dataTransfer.setData("type", type);
    };

    const handleOnClickBody = (e: React.MouseEvent) => {
        e.stopPropagation();
        dispatch({ type: "CHANGE_CLICKED_ELEMENT", payload: { elementDetails: element } });
    };

    const handleDeleteElement = () => {
        dispatch({ type: "DELETE_ELEMENT", payload: { elementDetails: element } });
    };

    const handleOpenCheckout = async () => {
        if (!orderReady || !subAccountConnectAccId) return;
        try {
            // Create order for the first live product's price
            const firstProduct = livePrices[0] as any;
            const orderRes = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/razorpay/create-order`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerId: subaccountId,
                    priceId: firstProduct?.productId ?? "",
                    amount: 0, // Amount should be fetched from product catalog
                    currency: "INR",
                }),
            });
            const orderData = await orderRes.json();

            if (!orderRes.ok) {
                throw new Error(orderData.error || "Failed to create order");
            }

            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                order_id: orderData.orderId,
                name: "Pyvra Checkout",
                description: "Product Purchase",
                handler: () => {
                    toast({
                        className: "z-[100000]",
                        title: "Payment Successful",
                        description: "Your payment has been completed.",
                    });
                    router.refresh();
                },
                theme: { color: "#6c47ff" },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (error: any) {
            toast({
                className: "z-[100000]",
                variant: "destructive",
                title: "Oops!",
                description: error.message ?? "Something went wrong",
            });
        }
    };

    return (
        <div
            style={styles}
            draggable
            onDragStart={(e) => handleDragStart(e, "paymentForm")}
            onClick={handleOnClickBody}
            className={clsx("p-[2px] w-full relative text-[16px] transition-all flex items-center justify-center", {
                "!border-blue-500": state.editor.selectedElement.id === id,
                "!border-solid": state.editor.selectedElement.id === id,
                "border-dashed border-[1px] border-slate-300": !state.editor.liveMode,
            })}
        >
            {state.editor.selectedElement.id === id && !state.editor.liveMode && <Badge className="absolute -top-[23px] -left-[1px] rounded-none rounded-t-lg ">{state.editor.selectedElement.name}</Badge>}

            <div className="border-none transition-all w-full">
                <div className="flex flex-col gap-4 w-full">
                    {subAccountConnectAccId && orderReady ? (
                        <div className="text-white flex flex-col items-center gap-4 p-4">
                            <p className="text-sm text-muted-foreground text-center">
                                Razorpay checkout is ready. Click below to open the payment modal.
                            </p>
                            {state.editor.liveMode && (
                                <button
                                    onClick={handleOpenCheckout}
                                    className="bg-primary text-white py-2 px-6 rounded-md hover:bg-primary/90 transition-colors"
                                >
                                    Pay Now
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center w-full h-40">
                            <Loading />
                        </div>
                    )}
                </div>
            </div>

            {state.editor.selectedElement.id === id && !state.editor.liveMode && (
                <div className="absolute bg-primary px-2.5 py-1 text-xs font-bold  -top-[25px] -right-[1px] rounded-none rounded-t-lg !text-white">
                    <Trash className="cursor-pointer" size={16} onClick={handleDeleteElement} />
                </div>
            )}
        </div>
    );
};

export default Checkout;
