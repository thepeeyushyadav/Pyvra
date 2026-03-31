import AgencyDetails from "@/components/forms/agency-details";
import { getAuthUserDetails, verifyAndAcceptInvitation } from "@/lib/queries";
import { currentUser } from "@clerk/nextjs/server";
import { Plan } from "@prisma/client";
import { redirect } from "next/navigation";
import React from "react";

const Page = async ({
  searchParams,
}: {
  searchParams: Promise<{
    plan: Plan;
    state: string;
    code: string;
  }>;
}) => {
  const params = await searchParams;
  const agencyId = await verifyAndAcceptInvitation();
  const user = await getAuthUserDetails();

  if (agencyId) {
    if (user?.role === "SUBACCOUNT_GUEST" || user?.role === "SUBACCOUNT_USER") {
      return redirect("/subaccount");
    } else if (user?.role === "AGENCY_OWNER" || user?.role === "AGENCY_ADMIN") {
      if (params.plan) {
        return redirect(`/agency/${agencyId}/billing?plan=${params.plan}`);
      }
      if (params.state) {
        const statePath = params.state.split("__")[0];
        const stateAgencyId = params.state.split("__")[1];
        if (!stateAgencyId) return <div>Not authorized</div>;
        return redirect(
          `/agency/${stateAgencyId}/${statePath}?code=${params.code}`,
        );
      } else {
        return redirect(`/agency/${agencyId}`);
      }
    } else {
      return <div>Not authorized</div>;
    }
  }

  const authUser = await currentUser();

  return (
    <div className="flex justify-center items-center mt-4">
      <div className="max-w-[850px] border p-4 rounded-xl">
        <h1 className="text-4xl">Create An Agency</h1>
        <AgencyDetails
          data={{
            companyEmail: authUser?.emailAddresses[0].emailAddress,
          }}
        />
      </div>
    </div>
  );
};

export default Page;
