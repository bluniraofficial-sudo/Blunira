import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { WhatsappTemplatesClient } from "@/components/whatsapp-templates-client";

export default async function AdvertiserWhatsappPage() {
  const session = await getSession();
  if (!session || session.role !== "ADVERTISER" || !session.advertiserId) {
    redirect("/auth/login");
  }

  // Fetch settings to pre-populate fallbacks
  const settings = await db.settings.findMany();

  return (
    <WhatsappTemplatesClient
      initialSettings={settings}
      role="ADVERTISER"
      lockedAdvertiserId={session.advertiserId}
    />
  );
}
