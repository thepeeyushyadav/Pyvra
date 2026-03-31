"use client";
import { SubAccount } from "@prisma/client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { createMedia, saveActivityLogsNotification } from "@/lib/queries";
import { UploadDropzone } from "@/lib/uploadthing";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "File name is required"),
  link: z.string().min(1, "Please upload a file"),
});

type Props = {
  agencyId: string;
  subAccounts: SubAccount[];
};

const UploadMediaBtn = ({ agencyId, subAccounts }: Props) => {
  const [open, setOpen] = useState(false);
  const [selectedSubAccountId, setSelectedSubAccountId] = useState<string>(
    subAccounts[0]?.id ?? "",
  );
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", link: "" },
  });

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!selectedSubAccountId) return;
    try {
      const response = await createMedia(selectedSubAccountId, values);
      await saveActivityLogsNotification({
        agencyId: undefined,
        description: `Uploaded a media file | ${response.name}`,
        subAccountId: selectedSubAccountId,
      });
      toast({ title: "Success", description: "Media uploaded successfully" });
      form.reset();
      setOpen(false);
      router.refresh();
    } catch {
      toast({
        variant: "destructive",
        title: "Failed",
        description: "Could not upload media. Please try again.",
      });
    }
  };

  if (!subAccounts.length) {
    return (
      <Button disabled title="Create a subaccount first">
        Upload
      </Button>
    );
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Upload</Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader className="pt-4 text-left">
            <DialogTitle className="text-2xl font-bold">
              Upload Media
            </DialogTitle>
            <DialogDescription>
              Upload a file to your media bucket
            </DialogDescription>
          </DialogHeader>

          {/* Subaccount selector */}
          <div className="space-y-1">
            <p className="text-sm font-medium">Upload to Subaccount</p>
            <Select
              value={selectedSubAccountId}
              onValueChange={setSelectedSubAccountId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a subaccount" />
              </SelectTrigger>
              <SelectContent>
                {subAccounts.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id}>
                    {sub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Upload form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>File Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Agency Banner Img" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Media File</FormLabel>
                    <FormControl>
                      {field.value ? (
                        <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/30">
                          <span className="text-sm text-green-500 truncate flex-1">
                            ✓ File uploaded
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => field.onChange("")}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="w-full bg-muted/30 rounded-md">
                          <UploadDropzone
                            endpoint="media"
                            onClientUploadComplete={(res) => {
                              field.onChange(res?.[0]?.url);
                            }}
                            onUploadError={(error) => {
                              toast({
                                variant: "destructive",
                                title: "Upload Error",
                                description: error.message,
                              });
                            }}
                          />
                        </div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />{" "}
                    Uploading...
                  </>
                ) : (
                  "Upload Media"
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UploadMediaBtn;
