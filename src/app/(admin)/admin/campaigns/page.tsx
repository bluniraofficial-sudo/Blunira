import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CampaignService } from "@/services/campaign";
import { AdvertiserService } from "@/services/advertiser";
import { CampaignsClient } from "@/components/campaigns-client";

export default async function AdminCampaignsPage() {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    redirect("/auth/login");
  }

  // Fetch campaigns and advertisers lists
  const campaigns = await CampaignService.getAll(session);
  const advertisers = await AdvertiserService.getAll(session);

  return (
    <CampaignsClient
      initialCampaigns={campaigns}
      advertisers={advertisers}
      role={session.role}
    />
  );
}
