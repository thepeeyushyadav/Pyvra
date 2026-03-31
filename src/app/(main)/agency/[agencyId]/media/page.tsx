import { getAgencyMedia } from "@/lib/queries";
import BlurPage from "@/components/global/blur-page";
import MediaBucket from "./media-bucket";
import React from "react";

type Props = {
  params: Promise<{ agencyId: string }>;
};

const AgencyMediaPage = async ({ params }: Props) => {
  const { agencyId } = await params;
  const data = await getAgencyMedia(agencyId);

  return (
    <BlurPage>
      <MediaBucket data={data} agencyId={agencyId} />
    </BlurPage>
  );
};

export default AgencyMediaPage;
