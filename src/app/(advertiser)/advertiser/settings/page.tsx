import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AdvertiserSettingsClient } from "@/components/advertiser-settings-client";

export default async function AdvertiserSettingsPage() {
  const session = await getSession();
  if (!session || session.role !== "ADVERTISER" || !session.advertiserId) {
    redirect("/auth/login");
  }

  // Fetch advertiser profile
  const advertiser = await db.advertiser.findUnique({
    where: { id: session.advertiserId },
  });

  // Fetch in-app notifications
  const notifications = await db.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <AdvertiserSettingsClient
      advertiser={advertiser}
      notifications={notifications}
    />
  );
}
