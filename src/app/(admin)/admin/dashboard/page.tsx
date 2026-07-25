import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AnalyticsService } from "@/services/analytics";
import { AdminDashboardClient } from "@/components/admin-dashboard-client";

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    redirect("/auth/login");
  }

  // Fetch full system analytics overview
  const data = await AnalyticsService.getOverview(session);

  return <AdminDashboardClient data={data} />;
}
