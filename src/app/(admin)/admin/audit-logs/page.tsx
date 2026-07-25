import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AuditLogsClient } from "@/components/audit-logs-client";

export default async function AdminAuditLogsPage() {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    redirect("/auth/login");
  }

  // Fetch audit logs with user information
  const logs = await db.auditLog.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
          role: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return <AuditLogsClient initialLogs={logs} />;
}
