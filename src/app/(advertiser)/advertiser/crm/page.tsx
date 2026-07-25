import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LeadService } from "@/services/lead";
import { CrmDashboardClient } from "@/components/crm-dashboard-client";

export default async function AdvertiserCrmPage() {
  const session = await getSession();
  if (!session || session.role !== "ADVERTISER") {
    redirect("/auth/login");
  }

  const leads = await LeadService.getAll(session);

  return (
    <CrmDashboardClient
      initialLeads={leads}
      advertisers={[]}
      role={session.role}
    />
  );
}

