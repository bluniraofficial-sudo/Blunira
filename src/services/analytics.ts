import { db } from "@/lib/db";
import { JWTPayload } from "@/lib/auth";

export class AnalyticsService {
  static async getOverview(user: JWTPayload, campaignId?: string) {
    const isAdvertiser = user.role === "ADVERTISER";
    const advertiserId = user.advertiserId;

    // Build common filter conditions for QrScan and Lead
    const scanWhere: any = {};
    const leadWhere: any = { isDeleted: false };

    if (campaignId) {
      scanWhere.qrCode = { campaignId };
      leadWhere.campaignId = campaignId;
    } else if (isAdvertiser) {
      if (!advertiserId) throw new Error("Unauthorized advertiser context");
      scanWhere.qrCode = { campaign: { advertiserId, isDeleted: false } };
      leadWhere.advertiserId = advertiserId;
    } else {
      // Super Admin: only exclude deleted campaigns
      scanWhere.qrCode = { campaign: { isDeleted: false } };
    }

    // 1. Fetch all scans fitting the criteria
    const scans = await db.qrScan.findMany({
      where: scanWhere,
      orderBy: { scannedAt: "asc" },
    });

    // 2. Fetch all leads fitting the criteria
    const leads = await db.lead.findMany({
      where: leadWhere,
      orderBy: { createdAt: "asc" },
    });

    const totalScans = scans.length;
    const totalLeads = leads.length;

    // Calculate unique/repeat scans based on IP address
    const ipCounts = new Map<string, number>();
    scans.forEach((s: any) => {
      if (s.ipAddress) {
        ipCounts.set(s.ipAddress, (ipCounts.get(s.ipAddress) || 0) + 1);
      }
    });

    let uniqueScans = 0;
    let repeatScans = 0;

    ipCounts.forEach((count) => {
      if (count > 0) uniqueScans++;
      if (count > 1) repeatScans += count - 1;
    });

    // Conversion rate
    const conversionRate = totalScans > 0 ? parseFloat(((totalLeads / totalScans) * 100).toFixed(1)) : 0;

    // 3. Aggregate Daily Graph (Last 7 Days)
    const dailyDataMap = new Map<string, { date: string; scans: number; leads: number }>();
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dailyDataMap.set(dateStr, { date: dateStr, scans: 0, leads: 0 });
    }

    scans.forEach((s: any) => {
      const dateStr = s.scannedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (dailyDataMap.has(dateStr)) {
        const item = dailyDataMap.get(dateStr)!;
        item.scans++;
      }
    });

    leads.forEach((l: any) => {
      const dateStr = l.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (dailyDataMap.has(dateStr)) {
        const item = dailyDataMap.get(dateStr)!;
        item.leads++;
      }
    });

    const dailyGraph = Array.from(dailyDataMap.values());

    // 4. Aggregate Monthly Graph (Last 6 Months)
    const monthlyDataMap = new Map<string, { month: string; scans: number; leads: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(now.getMonth() - i);
      const monthStr = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      monthlyDataMap.set(monthStr, { month: monthStr, scans: 0, leads: 0 });
    }

    scans.forEach((s: any) => {
      const monthStr = s.scannedAt.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      if (monthlyDataMap.has(monthStr)) {
        const item = monthlyDataMap.get(monthStr)!;
        item.scans++;
      }
    });

    leads.forEach((l: any) => {
      const monthStr = l.createdAt.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      if (monthlyDataMap.has(monthStr)) {
        const item = monthlyDataMap.get(monthStr)!;
        item.leads++;
      }
    });

    const monthlyGraph = Array.from(monthlyDataMap.values());

    // 5. Devices Breakdown
    const devicesMap = new Map<string, number>();
    scans.forEach((s: any) => {
      const dev = s.deviceType || "Unknown";
      devicesMap.set(dev, (devicesMap.get(dev) || 0) + 1);
    });
    const deviceBreakdown = Array.from(devicesMap.entries()).map(([name, value]) => ({ name, value }));

    // 6. OS Breakdown
    const osMap = new Map<string, number>();
    scans.forEach((s: any) => {
      const osName = s.os || "Unknown";
      osMap.set(osName, (osMap.get(osName) || 0) + 1);
    });
    const osBreakdown = Array.from(osMap.entries()).map(([name, value]) => ({ name, value }));

    // 7. Browsers Breakdown
    const browsersMap = new Map<string, number>();
    scans.forEach((s: any) => {
      const browserName = s.browser || "Unknown";
      browsersMap.set(browserName, (browsersMap.get(browserName) || 0) + 1);
    });
    const browserBreakdown = Array.from(browsersMap.entries()).map(([name, value]) => ({ name, value }));

    // 8. Cities Breakdown (Top 5)
    const citiesMap = new Map<string, number>();
    scans.forEach((s: any) => {
      const city = s.city || "Unknown";
      citiesMap.set(city, (citiesMap.get(city) || 0) + 1);
    });
    const cityBreakdown = Array.from(citiesMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // 9. Campaign Comparisons (All campaigns under tenant/global)
    const campaignCompareWhere: any = { isDeleted: false };
    if (isAdvertiser) {
      campaignCompareWhere.advertiserId = advertiserId;
    }
    const campaigns = await db.campaign.findMany({
      where: campaignCompareWhere,
      include: {
        _count: {
          select: { qrCodes: true, leads: true },
        },
        qrCodes: {
          select: { scanCount: true },
        },
      },
    });

    const campaignComparison = campaigns.map((c: any) => {
      const scansSum = c.qrCodes.reduce((sum: number, q: any) => sum + q.scanCount, 0);
      return {
        name: c.name,
        scans: scansSum,
        leads: c._count.leads,
        conversion: scansSum > 0 ? parseFloat(((c._count.leads / scansSum) * 100).toFixed(1)) : 0,
      };
    });

    // 10. Fetch 50 most recent detailed scans
    const recentScans = await db.qrScan.findMany({
      where: scanWhere,
      include: {
        qrCode: {
          include: {
            campaign: true,
          },
        },
      },
      orderBy: { scannedAt: "desc" },
      take: 50,
    });

    return {
      metrics: {
        totalScans,
        uniqueScans,
        repeatScans,
        leads: totalLeads,
        conversionRate,
      },
      dailyGraph,
      monthlyGraph,
      deviceBreakdown,
      osBreakdown,
      browserBreakdown,
      cityBreakdown,
      campaignComparison,
      recentScans,
    };
  }
}
