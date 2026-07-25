import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CampaignService } from "@/services/campaign";
import { CampaignsClient } from "@/components/campaigns-client";

export default async function AdvertiserCampaignsPage() {
  const session = await getSession();
  if (!session || session.role !== "ADVERTISER") {
    redirect("/auth/login");
  }

  // Fetch only this advertiser's campaigns
  const campaigns = await CampaignService.getAll(session);

  return (
    <CampaignsClient
      initialCampaigns={campaigns}
      role={session.role}
    />
  );
}
