"use client";
import { saveActivityLogsNotification, sendInvitation } from "@/lib/queries";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Loading from "../global/loading";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useToast } from "../ui/use-toast";
import { useRouter } from "next/navigation";
import { useModal } from "@/providers/modal-provider";

interface SendInvitationProps {
  agencyId: string;
}

const SendInvitation: React.FC<SendInvitationProps> = ({ agencyId }) => {
  const { toast } = useToast();
  const router = useRouter();
  const { setClose } = useModal();

  const userDataSchema = z.object({
    email: z.string().email(),
    role: z.enum(["AGENCY_ADMIN", "SUBACCOUNT_USER", "SUBACCOUNT_GUEST"]),
  });

  const form = useForm<z.infer<typeof userDataSchema>>({
    resolver: zodResolver(userDataSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      role: "SUBACCOUNT_USER",
    },
  });

  const onSubmit = async (values: z.infer<typeof userDataSchema>) => {
    try {
      const email = form.getValues("email");
      const role = form.getValues("role");

      if (!email || !role) {
        toast({
          variant: "destructive",
          title: "Oops!",
          description: "Please fill in all fields correctly.",
        });
        return;
      }

      const response = await sendInvitation(email, role, agencyId);

      if (response.error) {
        toast({
          variant: "destructive",
          title: "Oops!",
          description: response.error,
        });
        return;
      }

      if (response.success) {
        const isDirectAdd = (response as any).directAdd === true;

        await saveActivityLogsNotification({
          agencyId,
          description: isDirectAdd
            ? `Added existing user ${response.success.email} to the team`
            : `Invitation sent to ${response.success.email}`,
          subAccountId: undefined,
        });

        toast({
          title: "Success",
          description: isDirectAdd
            ? "User has been added to your team directly."
            : "Invitation sent successfully.",
        });

        form.reset();
        setClose();
        router.refresh();
      }
    } catch (error) {
      console.log(error);
      toast({
        variant: "destructive",
        title: "Oops!",
        description: "An unexpected error occurred. Please try again.",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invitation</CardTitle>
        <CardDescription>
          An invitation will be sent to the user. Users who already have an
          invitation sent out to their email, will not receive another
          invitation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <FormField
              disabled={form.formState.isSubmitting}
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              disabled={form.formState.isSubmitting}
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>User role</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value)}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user role..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="AGENCY_ADMIN">Agency Admin</SelectItem>
                      <SelectItem value="SUBACCOUNT_USER">
                        Sub Account User
                      </SelectItem>
                      <SelectItem value="SUBACCOUNT_GUEST">
                        Sub Account Guest
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button disabled={form.formState.isSubmitting} type="submit">
              {form.formState.isSubmitting ? <Loading /> : "Send Invitation"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default SendInvitation;
