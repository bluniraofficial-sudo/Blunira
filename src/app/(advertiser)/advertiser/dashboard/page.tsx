import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AnalyticsService } from "@/services/analytics";
import { AdvertiserDashboardClient } from "@/components/advertiser-dashboard-client";

export default async function AdvertiserDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== "ADVERTISER") {
    redirect("/auth/login");
  }

  // Fetch tenant-isolated analytics overview
  const data = await AnalyticsService.getOverview(session);

  return <AdvertiserDashboardClient data={data} />;
}
