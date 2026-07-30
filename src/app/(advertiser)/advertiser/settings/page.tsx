import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AdvertiserSettingsClient } from "@/components/advertiser-settings-client";

export default async function AdvertiserSettingsPage() {
  const session = await getSession();
  if (!session || session.role !== "ADVERTISER" || !session.advertiserId) {
    redirect("/auth/login");
  }

  const advertiserId = session.advertiserId;

  // Fetch advertiser profile
  const advertiser = await db.advertiser.findUnique({
    where: { id: advertiserId },
  });

  // Fetch in-app notifications
  const notifications = await db.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // ── Analytics ─────────────────────────────────────

  // Get all campaign IDs for this advertiser
  const campaigns = await db.campaign.findMany({
    where: { advertiserId, isDeleted: false },
    select: { id: true },
  });
  const campaignIds = campaigns.map((c) => c.id);

  // Get all QR code IDs for this advertiser's campaigns
  const qrCodes = await db.qrCode.findMany({
    where: { campaignId: { in: campaignIds }, isDeleted: false },
    select: { id: true },
  });
  const qrCodeIds = qrCodes.map((q) => q.id);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // Async count helpers
  const [totalScans, totalLeads, activeCampaigns] = await Promise.all([
    db.qrScan.count({ where: { qrCodeId: { in: qrCodeIds } } }),
    db.lead.count({ where: { campaignId: { in: campaignIds } } }),
    db.campaign.count({ where: { advertiserId, status: "ACTIVE", isDeleted: false } }),
  ]);

  const [monthScans, monthLeads] = await Promise.all([
    db.qrScan.count({ where: { qrCodeId: { in: qrCodeIds }, scannedAt: { gte: startOfMonth } } }),
    db.lead.count({ where: { campaignId: { in: campaignIds }, createdAt: { gte: startOfMonth } } }),
  ]);

  const [quarterScans, quarterLeads] = await Promise.all([
    db.qrScan.count({ where: { qrCodeId: { in: qrCodeIds }, scannedAt: { gte: startOfQuarter } } }),
    db.lead.count({ where: { campaignId: { in: campaignIds }, createdAt: { gte: startOfQuarter } } }),
  ]);

  const [yearScans, yearLeads] = await Promise.all([
    db.qrScan.count({ where: { qrCodeId: { in: qrCodeIds }, scannedAt: { gte: startOfYear } } }),
    db.lead.count({ where: { campaignId: { in: campaignIds }, createdAt: { gte: startOfYear } } }),
  ]);

  const analytics = {
    totalScans,
    totalLeads,
    activeCampaigns,
    month: { scans: monthScans, leads: monthLeads },
    quarter: { scans: quarterScans, leads: quarterLeads },
    year: { scans: yearScans, leads: yearLeads },
  };

  return (
    <AdvertiserSettingsClient
      advertiser={advertiser}
      notifications={notifications}
      analytics={analytics}
    />
  );
}
