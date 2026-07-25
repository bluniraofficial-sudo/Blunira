import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LeadService } from "@/services/lead";
import { LeadsClient } from "@/components/leads-client";

export default async function AdminLeadsPage() {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    redirect("/auth/login");
  }

  // Fetch all leads submissions
  const leads = await LeadService.getAll(session);

  return (
    <LeadsClient
      initialLeads={leads}
      role={session.role}
    />
  );
}
