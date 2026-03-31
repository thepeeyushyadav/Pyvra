import { ChildrenProps } from "@/@types";
import BlurPage from "@/components/global/blur-page";
import InfoBar from "@/components/global/infobar";
import Sidebar from "@/components/sidebar";
import Unauthorized from "@/components/unauthorized";
import {
  ensureAgencyMediaSidebarOption,
  getNotificationAndUser,
  verifyAndAcceptInvitation,
} from "@/lib/queries";
import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{
    agencyId: string;
  }>;
} & ChildrenProps;

const Layout = async ({ children, params }: Props) => {
  const { agencyId: paramsAgencyId } = await params;
  const agencyId = await verifyAndAcceptInvitation();
  const user = await currentUser();

  if (!user) {
    return redirect("/");
  }

  if (!agencyId) {
    return redirect(`/agency`);
  }

  // Re-sync role from DB → Clerk privateMetadata to prevent stale-token RBAC bypass
  const dbUser = await db.user.findUnique({
    where: { email: user.emailAddresses[0].emailAddress },
    select: { role: true },
  });

  if (dbUser && dbUser.role !== user.privateMetadata.role) {
    await (await clerkClient()).users.updateUserMetadata(user.id, {
      privateMetadata: { role: dbUser.role },
    });
    // Force the layout to re-check with the fresh role from DB
    if (
      dbUser.role !== "AGENCY_OWNER" &&
      dbUser.role !== "AGENCY_ADMIN"
    ) {
      return <Unauthorized />;
    }
  } else if (
    user.privateMetadata.role !== "AGENCY_OWNER" &&
    user.privateMetadata.role !== "AGENCY_ADMIN"
  ) {
    return <Unauthorized />;
  }

  await ensureAgencyMediaSidebarOption(agencyId);

  let allNoti: any = [];
  const notifications = await getNotificationAndUser(agencyId);
  if (notifications) allNoti = notifications;

  return (
    <div className="h-screen overflow-hidden">
      <Sidebar id={paramsAgencyId} type="agency" />
      <div className="md:pl-[300px]">
        <InfoBar notifications={allNoti} role={allNoti.User?.role} />
        <div className="relative">
          <BlurPage>{children}</BlurPage>
        </div>
      </div>
    </div>
  );
};

export default Layout;
