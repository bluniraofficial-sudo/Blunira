import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { QrCodeService } from "@/services/qrcode";
import { CampaignService } from "@/services/campaign";
import { QrCodesClient } from "@/components/qr-codes-client";

export default async function AdminQrCodesPage() {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    redirect("/auth/login");
  }

  // Fetch lists
  const qrCodes = await QrCodeService.getAll(session);
  const campaigns = await CampaignService.getAll(session);

  return (
    <QrCodesClient
      initialQrCodes={qrCodes}
      campaigns={campaigns}
    />
  );
}
