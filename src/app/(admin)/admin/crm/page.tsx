import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LeadService } from "@/services/lead";
import { db } from "@/lib/db";
import { CrmDashboardClient } from "@/components/crm-dashboard-client";

export default async function AdminCrmPage() {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    redirect("/auth/login");
  }

  const [leads, advertisers] = await Promise.all([
    LeadService.getAll(session),
    db.advertiser.findMany({
      where: { isDeleted: false },
      orderBy: { companyName: "asc" },
      select: { id: true, name: true, companyName: true },
    }),
  ]);

  return (
    <CrmDashboardClient
      initialLeads={leads}
      advertisers={advertisers}
      role={session.role}
    />
  );
}

