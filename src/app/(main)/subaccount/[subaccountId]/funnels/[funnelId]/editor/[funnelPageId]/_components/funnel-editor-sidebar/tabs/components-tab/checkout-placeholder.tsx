import { EditorBtns } from "@/lib/constants";
import { Youtube } from "lucide-react";
import Image from "next/image";
import React from "react";

type Props = {};

const CheckoutPlaceholder = (props: Props) => {
    const handleDragStart = (e: React.DragEvent, type: EditorBtns) => {
        if (type === null) return;
        e.dataTransfer.setData("type", type);
    };
    return (
        <div draggable onDragStart={(e) => handleDragStart(e, "paymentForm")} className=" h-14 w-14 bg-muted rounded-lg flex items-center justify-center">
            <div className="flex items-center justify-center h-[40px] w-[40px] bg-primary/20 rounded text-primary font-bold text-xs">RZP</div>
        </div>
    );
};

export default CheckoutPlaceholder;
