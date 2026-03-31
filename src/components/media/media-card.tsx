"use client";
import { Media } from "@prisma/client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
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
} from "../ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import Image from "next/image";
import { Copy, Loader2, MoreHorizontal, Trash } from "lucide-react";
import { useToast } from "../ui/use-toast";
import { deleteMedia, saveActivityLogsNotification } from "@/lib/queries";

type Props = {
  file: Media;
};

const MediaCard = ({ file }: Props) => {
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
      const response = await deleteMedia(file.id);
      await saveActivityLogsNotification({
        agencyId: undefined,
        description: `Deleted a media file | ${file.name}`,
        subAccountId: response.subAccountId,
      });
      toast({
        title: "Deleted File",
        description: "Successfully deleted the file",
      });
      router.refresh();
    } catch (err) {
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
          {/* Image Preview */}
          <div className="relative w-full h-40">
            <Image
              src={file.link}
              alt={file.name}
              fill
              className="object-cover"
            />
          </div>

          {/* Card Footer */}
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

            {/* Three-dot menu trigger */}
            <div className="absolute top-4 right-4 p-[1px] cursor-pointer">
              <DropdownMenuTrigger>
                <MoreHorizontal size={18} />
              </DropdownMenuTrigger>
            </div>
          </div>

          {/* Dropdown options */}
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

      {/* Delete confirmation dialog */}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-left">
            Are you absolutely sure?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            Are you sure you want to delete <strong>{file.name}</strong>? All
            subaccounts using this file will no longer have access to it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex items-center">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={loading}
            className="bg-destructive hover:bg-destructive/90 flex gap-2"
            onClick={handleDelete}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default MediaCard;
