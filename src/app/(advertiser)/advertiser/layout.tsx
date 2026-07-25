import { DashboardLayoutShell } from "@/components/dashboard-layout";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function AdvertiserLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/auth/login");
  }

  // Verify the user exists in the database to prevent ghost/stale sessions
  const dbUser = await db.user.findFirst({
    where: { id: session.userId, isDeleted: false },
  });

  if (!dbUser) {
    redirect("/api/auth/logout");
  }

  return <DashboardLayoutShell>{children}</DashboardLayoutShell>;
}
