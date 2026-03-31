"use client";
import { Media, SubAccount } from "@prisma/client";
import React, { useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { FolderSearch } from "lucide-react";
import MediaCard from "./media-card";
import AgencyUploadButton from "./agency-upload-button";

type SubAccountWithMedia = SubAccount & { Media: Media[] };

type Props = {
  data: SubAccountWithMedia[];
  agencyId: string;
};

const AgencyMediaComponent = ({ data, agencyId }: Props) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Flatten all media into a searchable list, keeping subaccount info
  const allMedia = data.flatMap((subAccount) =>
    subAccount.Media.map((file) => ({
      ...file,
      subAccountName: subAccount.name,
    }))
  );

  const filteredData =
    searchTerm.trim().length > 0
      ? data
          .map((subAccount) => ({
            ...subAccount,
            Media: subAccount.Media.filter((file) =>
              file.name.toLowerCase().includes(searchTerm.toLowerCase())
            ),
          }))
          .filter((subAccount) => subAccount.Media.length > 0)
      : data;

  const hasAnyMedia = allMedia.length > 0;
  const hasFilteredResults = filteredData.some((s) => s.Media.length > 0);

  return (
    <div className="flex flex-col gap-4 h-full w-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-4xl">Media Bucket</h1>
        <AgencyUploadButton agencyId={agencyId} subAccounts={data} />
      </div>

      {/* Search + listing */}
      <Command className="bg-transparent">
        <CommandInput
          placeholder="Search for file name..."
          value={searchTerm}
          onValueChange={setSearchTerm}
        />
        <CommandList className="max-h-full pb-40">
          {!hasAnyMedia && (
            <CommandEmpty>No Media Files</CommandEmpty>
          )}

          {hasAnyMedia && !hasFilteredResults && (
            <CommandEmpty>No files match your search</CommandEmpty>
          )}

          {filteredData.map((subAccount) => {
            if (!subAccount.Media.length) return null;
            return (
              <CommandGroup
                key={subAccount.id}
                heading={subAccount.name}
                className="mb-4"
              >
                <div className="flex flex-wrap gap-4 pt-4">
                  {subAccount.Media.map((file) => (
                    <CommandItem
                      key={file.id}
                      className="p-0 max-w-[300px] w-full rounded-lg !bg-transparent !font-medium !text-white"
                    >
                      <MediaCard file={file} />
                    </CommandItem>
                  ))}
                </div>
              </CommandGroup>
            );
          })}

          {!hasAnyMedia && (
            <div className="flex items-center justify-center w-full h-full flex-col mt-10">
              <FolderSearch
                size={200}
                className="dark:text-muted text-slate-300"
              />
              <p className="text-muted-foreground">Empty! no files to show</p>
            </div>
          )}
        </CommandList>
      </Command>
    </div>
  );
};

export default AgencyMediaComponent;
