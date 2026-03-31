"use client";
import { Media, SubAccount } from "@prisma/client";
import React, { useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
  CommandItem,
} from "@/components/ui/command";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Copy,
  FolderSearch,
  Loader2,
  MoreHorizontal,
  Trash,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { deleteMedia, saveActivityLogsNotification } from "@/lib/queries";
import UploadMediaBtn from "./upload-media-btn";

type SubAccountWithMedia = SubAccount & { Media: Media[] };

type Props = {
  data: SubAccountWithMedia[];
  agencyId: string;
};

/* ─── MediaCard (inline) ─────────────────────────────────────── */
const MediaCard = ({ file }: { file: Media }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(file.link);
    toast({ title: "Copied To Clipboard", description: file.link });
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await deleteMedia(file.id);
      await saveActivityLogsNotification({
        agencyId: undefined,
        description: `Deleted a media file | ${file.name}`,
        subAccountId: res.subAccountId,
      });
      toast({ title: "Deleted File", description: "Successfully deleted the file" });
      router.refresh();
    } catch {
      toast({
        variant: "destructive",
        title: "Failed",
        description: "Could not delete the file. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <DropdownMenu>
        <article className="w-full border rounded-lg bg-slate-900 overflow-hidden">
          <div className="relative w-full h-40">
            <Image src={file.link} alt={file.name} fill className="object-cover" />
          </div>
          <div className="p-4 relative">
            <p className="text-muted-foreground text-xs">
              {new Date(file.createdAt).toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
            <p className="font-medium truncate pr-6">{file.name}</p>
            <div className="absolute top-4 right-4 cursor-pointer">
              <DropdownMenuTrigger>
                <MoreHorizontal size={18} />
              </DropdownMenuTrigger>
            </div>
          </div>
          <DropdownMenuContent>
            <DropdownMenuLabel>Menu</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex gap-2" onClick={handleCopyLink}>
              <Copy size={15} /> Copy Image Link
            </DropdownMenuItem>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem className="flex gap-2 text-destructive focus:text-destructive">
                <Trash size={15} /> Delete File
              </DropdownMenuItem>
            </AlertDialogTrigger>
          </DropdownMenuContent>
        </article>
      </DropdownMenu>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-left">Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            Are you sure you want to delete <strong>{file.name}</strong>? All subaccounts using
            this file will no longer have access to it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={loading}
            className="bg-destructive hover:bg-destructive/90 flex gap-2"
            onClick={handleDelete}
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Deleting...</>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

/* ─── MediaBucket (main export) ─────────────────────────────── */
const MediaBucket = ({ data, agencyId }: Props) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered =
    searchTerm.trim().length > 0
      ? data
          .map((sub) => ({
            ...sub,
            Media: sub.Media.filter((f) =>
              f.name.toLowerCase().includes(searchTerm.toLowerCase())
            ),
          }))
          .filter((sub) => sub.Media.length > 0)
      : data;

  const totalMedia = data.reduce((acc, s) => acc + s.Media.length, 0);
  const hasResults = filtered.some((s) => s.Media.length > 0);

  return (
    <div className="flex flex-col gap-4 h-full w-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-4xl">Media Bucket</h1>
        <UploadMediaBtn agencyId={agencyId} subAccounts={data} />
      </div>

      {/* Search + Grid */}
      <Command className="bg-transparent">
        <CommandInput
          placeholder="Search for file name..."
          value={searchTerm}
          onValueChange={setSearchTerm}
        />
        <CommandList className="max-h-full pb-40">
          {totalMedia === 0 && <CommandEmpty>No Media Files</CommandEmpty>}
          {totalMedia > 0 && !hasResults && (
            <CommandEmpty>No files match your search</CommandEmpty>
          )}

          {filtered.map((subAccount) => {
            if (!subAccount.Media.length) return null;
            return (
              <CommandGroup key={subAccount.id} heading={subAccount.name} className="mb-4">
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

          {totalMedia === 0 && (
            <div className="flex items-center justify-center w-full flex-col mt-10">
              <FolderSearch size={200} className="dark:text-muted text-slate-300" />
              <p className="text-muted-foreground">Empty! no files to show</p>
            </div>
          )}
        </CommandList>
      </Command>
    </div>
  );
};

export default MediaBucket;
