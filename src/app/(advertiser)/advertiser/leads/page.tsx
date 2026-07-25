import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LeadService } from "@/services/lead";
import { LeadsClient } from "@/components/leads-client";

export default async function AdvertiserLeadsPage() {
  const session = await getSession();
  if (!session || session.role !== "ADVERTISER") {
    redirect("/auth/login");
  }

  // Fetch only this advertiser's leads
  const leads = await LeadService.getAll(session);

  return (
    <LeadsClient
      initialLeads={leads}
      role={session.role}
    />
  );
}
