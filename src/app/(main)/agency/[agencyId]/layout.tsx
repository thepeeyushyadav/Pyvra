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

  // Get the DB role as the source of truth
  const dbUser = await db.user.findUnique({
    where: { email: user.emailAddresses[0].emailAddress },
    select: { role: true },
  });

  const effectiveRole = dbUser?.role || user.privateMetadata.role;

  // Sync DB role to Clerk if out of date
  if (dbUser && dbUser.role !== user.privateMetadata.role) {
    await (await clerkClient()).users.updateUserMetadata(user.id, {
      privateMetadata: { role: dbUser.role },
    });
  }

  // Check authorization using the DB role
  if (
    effectiveRole !== "AGENCY_OWNER" &&
    effectiveRole !== "AGENCY_ADMIN"
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
