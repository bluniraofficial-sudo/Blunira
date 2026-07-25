import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { WhatsappTemplatesClient } from "@/components/whatsapp-templates-client";

export default async function AdminWhatsappPage() {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    redirect("/auth/login");
  }

  // Fetch configs/settings to pre-populate form
  const settings = await db.settings.findMany();
  
  // Fetch active advertisers for multi-tenant overrides selection
  const advertisers = await db.advertiser.findMany({
    where: { isDeleted: false },
    orderBy: { name: "asc" },
  });

  return (
    <WhatsappTemplatesClient initialSettings={settings} advertisers={advertisers} />
  );
}
