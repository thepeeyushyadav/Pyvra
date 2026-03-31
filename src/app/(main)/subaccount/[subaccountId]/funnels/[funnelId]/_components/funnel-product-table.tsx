"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { saveActivityLogsNotification, updateFunnelProducts } from "@/lib/queries";
import { Funnel } from "@prisma/client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

// Razorpay product shape (returned from getConnectAccountProducts stub or future API)
export type RazorpayProduct = {
    id: string;
    name: string;
    images: string[];
    default_price: {
        id: string;
        unit_amount: number | null;
        recurring: { interval: string } | null;
    } | null;
};

interface FunnelProductsTableProps {
    defaultData: Funnel;
    products: RazorpayProduct[];
}

const FunnelProductsTable: React.FC<FunnelProductsTableProps> = ({ defaultData, products }) => {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [liveProducts, setLiveProducts] = useState<
        | {
              productId: string;
              recurring: boolean;
          }[]
        | []
    >(JSON.parse(defaultData.liveProducts || "[]"));

    const handleSaveProducts = async () => {
        setIsLoading(true);
        const response = await updateFunnelProducts(JSON.stringify(liveProducts), defaultData.id);
        await saveActivityLogsNotification({
            agencyId: undefined,
            description: `Update funnel products | ${response.name}`,
            subAccountId: defaultData.subAccountId,
        });
        setIsLoading(false);
        toast({
            title: "Success",
            description: "Saved funnel products",
        });
        router.refresh();
    };

    const handleAddProduct = async (product: RazorpayProduct) => {
        const priceId = product.default_price?.id ?? product.id;
        const productIdExists = liveProducts.find((prod) => prod.productId === priceId);
        productIdExists
            ? setLiveProducts(liveProducts.filter((prod) => prod.productId !== priceId))
            : setLiveProducts([
                  ...liveProducts,
                  {
                      productId: priceId,
                      recurring: !!product.default_price?.recurring,
                  },
              ]);
    };

    return (
        <>
            <Table className="bg-card border-[1px] border-border rounded-md">
                <TableHeader className="rounded-md">
                    <TableRow>
                        <TableHead>Live</TableHead>
                        <TableHead>Image</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Interval</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="font-medium truncate">
                    {products.map((product) => (
                        <TableRow key={product.id}>
                            <TableCell>
                                <Input
                                    defaultChecked={
                                        !!liveProducts.find(
                                            (prod) => prod.productId === (product.default_price?.id ?? product.id)
                                        )
                                    }
                                    onChange={() => handleAddProduct(product)}
                                    type="checkbox"
                                    className="w-4 h-4"
                                />
                            </TableCell>
                            <TableCell>
                                {product.images[0] ? (
                                    <Image alt="product Image" height={60} width={60} src={product.images[0]} />
                                ) : (
                                    <div className="h-[60px] w-[60px] bg-muted rounded-md" />
                                )}
                            </TableCell>
                            <TableCell>{product.name}</TableCell>
                            <TableCell>
                                {product.default_price?.recurring ? "Recurring" : "One Time"}
                            </TableCell>
                            <TableCell className="text-right">
                                ${product.default_price?.unit_amount ? product.default_price.unit_amount / 100 : "0"}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <Button disabled={isLoading} onClick={handleSaveProducts} className="mt-4">
                Save Products
            </Button>
        </>
    );
};

export default FunnelProductsTable;
