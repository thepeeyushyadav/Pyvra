"use client";
import { SubAccount } from "@prisma/client";
import React, { useState } from "react";
import { useModal } from "@/providers/modal-provider";
import { Button } from "../ui/button";
import CustomModal from "../global/custom-modal";
import UploadMediaForm from "../forms/upload-media";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

type Props = {
  agencyId: string;
  subAccounts: SubAccount[];
};

const AgencyUploadButton = ({ agencyId, subAccounts }: Props) => {
  const { setOpen } = useModal();
  const [selectedSubAccountId, setSelectedSubAccountId] = useState<string>(
    subAccounts[0]?.id ?? ""
  );

  const handleUploadClick = () => {
    if (!selectedSubAccountId) return;

    setOpen(
      <CustomModal
        title="Upload Media"
        subheading="Upload a file to your media bucket"
      >
        <UploadMediaForm subaccountId={selectedSubAccountId} />
      </CustomModal>
    );
  };

  if (!subAccounts.length) {
    return (
      <Button disabled title="Create a subaccount first to upload media">
        Upload
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={selectedSubAccountId}
        onValueChange={setSelectedSubAccountId}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select subaccount" />
        </SelectTrigger>
        <SelectContent>
          {subAccounts.map((subAccount) => (
            <SelectItem key={subAccount.id} value={subAccount.id}>
              {subAccount.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={handleUploadClick} disabled={!selectedSubAccountId}>
        Upload
      </Button>
    </div>
  );
};

export default AgencyUploadButton;
