"use client";
import { GetMediaFiles } from "@/lib/types";
import React, { useState } from "react";
import UploadButton from "./upload-button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import MediaCard from "./media-card";
import { FolderSearch } from "lucide-react";

type Props = {
  data: GetMediaFiles;
  subaccountId: string;
};

const MediaComponent = ({ data, subaccountId }: Props) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMedia =
    searchTerm.trim().length > 0
      ? data?.Media.filter((file) =>
          file.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : data?.Media;

  return (
    <div className="flex flex-col gap-4 h-full w-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-4xl">Media Bucket</h1>
        <UploadButton subaccountId={subaccountId} />
      </div>

      {/* Search + Grid */}
      <Command className="bg-transparent">
        <CommandInput
          placeholder="Search for file name..."
          value={searchTerm}
          onValueChange={setSearchTerm}
        />
        <CommandList className="max-h-full pb-40">
          <CommandEmpty>No Media Files</CommandEmpty>

          {!!data?.Media.length && (
            <CommandGroup heading="Agency">
              <div className="flex flex-wrap gap-4 pt-4">
                {filteredMedia?.map((file) => (
                  <CommandItem
                    key={file.id}
                    className="p-0 max-w-[300px] w-full rounded-lg !bg-transparent !font-medium !text-white"
                  >
                    <MediaCard file={file} />
                  </CommandItem>
                ))}
              </div>
            </CommandGroup>
          )}

          {!data?.Media.length && (
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

export default MediaComponent;