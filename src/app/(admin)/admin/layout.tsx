import { DashboardLayoutShell } from "@/components/dashboard-layout";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/auth/login");
  }

  let dbUser = null;
  try {
    dbUser = await db.user.findFirst({
      where: { id: session.userId, isDeleted: false },
    });
  } catch (error) {
    console.error("Database connection failure in AdminLayout:", error);
    redirect("/500");
  }

  if (!dbUser) {
    redirect("/api/auth/logout");
  }

  return <DashboardLayoutShell>{children}</DashboardLayoutShell>;
}
