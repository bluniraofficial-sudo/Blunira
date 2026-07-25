import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SettingsClient } from "@/components/settings-client";

export default async function AdminSettingsPage() {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    redirect("/auth/login");
  }

  // Fetch configs, users, roles, and advertisers
  const settings = await db.settings.findMany();
  const users = await db.user.findMany({
    where: { isDeleted: false },
    include: { role: true, advertiser: true },
  });
  const roles = await db.role.findMany();
  const advertisers = await db.advertiser.findMany({ where: { isDeleted: false } });

  return (
    <SettingsClient
      settings={settings}
      users={users}
      roles={roles}
      advertisers={advertisers}
    />
  );
}
