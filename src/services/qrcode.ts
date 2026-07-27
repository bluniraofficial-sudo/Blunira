import { db } from "@/lib/db";
import { JWTPayload } from "@/lib/auth";

export class QrCodeService {
  /**
   * Automatic cleanup: soft delete QR codes associated with campaigns deleted or ended > 45 days ago.
   */
  static async purgeExpiredCampaignQrCodes() {
    const fortyFiveDaysAgo = new Date();
    fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);

    try {
      // Find campaigns deleted or ended 45+ days ago
      const expiredCampaigns = await db.campaign.findMany({
        where: {
          OR: [
            { isDeleted: true, updatedAt: { lt: fortyFiveDaysAgo } },
            { endDate: { lt: fortyFiveDaysAgo } },
          ],
        },
        select: { id: true },
      });

      if (expiredCampaigns.length > 0) {
        const campaignIds = expiredCampaigns.map((c) => c.id);
        await db.qrCode.updateMany({
          where: {
            campaignId: { in: campaignIds },
            isDeleted: false,
          },
          data: { isDeleted: true },
        });
      }
    } catch (err) {
      console.error("Failed to run 45-day QR code auto-cleanup:", err);
    }
  }

  static async getAll(user: JWTPayload) {
    // Run 45-day auto cleanup check
    await QrCodeService.purgeExpiredCampaignQrCodes();

    if (user.role === "ADVERTISER") {
      if (!user.advertiserId) throw new Error("Unauthorized advertiser context");
      return db.qrCode.findMany({
        where: {
          isDeleted: false,
          campaign: {
            advertiserId: user.advertiserId,
            isDeleted: false,
          },
        },
        include: {
          campaign: {
            include: { 
              advertiser: true,
              coupons: { where: { isDeleted: false }, take: 1 },
            },
          },
        },
        orderBy: { qrCodeId: "desc" },
      });
    }

    // Super Admin: get all QR codes
    return db.qrCode.findMany({
      where: { isDeleted: false },
      include: {
        campaign: {
          include: { 
            advertiser: true,
            coupons: { where: { isDeleted: false }, take: 1 },
          },
        },
      },
      orderBy: { qrCodeId: "desc" },
    });
  }

  static async getById(id: string, user: JWTPayload) {
    const qrCode = await db.qrCode.findFirst({
      where: {
        id,
        isDeleted: false,
      },
      include: {
        campaign: {
          include: { advertiser: true },
        },
      },
    });

    if (!qrCode) return null;

    if (user.role === "ADVERTISER" && qrCode.campaign.advertiserId !== user.advertiserId) {
      throw new Error("Forbidden: Access to this QR Code is denied");
    }

    return qrCode;
  }

  static async generateBatch(
    campaignId: string,
    count: number,
    bottleBatch: string | undefined,
    user: JWTPayload
  ) {
    const campaign = await db.campaign.findFirst({
      where: { id: campaignId, isDeleted: false },
    });
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    if (user.role === "ADVERTISER") {
      if (!user.advertiserId || campaign.advertiserId !== user.advertiserId) {
        throw new Error("Forbidden: You can only generate QR codes for your own campaigns");
      }
    }

    return db.$transaction(async (tx: any) => {
      const campaignPrefix = campaign.id.substring(0, 8).toUpperCase();

      const lastQr = await tx.qrCode.findFirst({
        where: { qrCodeId: { startsWith: `QR-${campaignPrefix}-` } },
        orderBy: { qrCodeId: "desc" },
      });

      let startNum = 0;
      if (lastQr) {
        const match = lastQr.qrCodeId.match(/QR-[A-Z0-9]+-(\d+)/);
        if (match) {
          startNum = parseInt(match[1], 10);
        }
      }

      const qrsData = [];
      for (let i = 1; i <= count; i++) {
        const nextNum = startNum + i;
        const qrCodeId = `QR-${campaignPrefix}-${String(nextNum).padStart(4, "0")}`;

        qrsData.push({
          qrCodeId,
          publicUrl: `/q/${qrCodeId}`,
          campaignId,
          bottleBatch: bottleBatch || "Default Batch",
          status: "ACTIVE",
        });
      }

      await tx.qrCode.createMany({
        data: qrsData,
      });

      return tx.qrCode.findMany({
        where: {
          campaignId,
          qrCodeId: { in: qrsData.map((q) => q.qrCodeId) },
        },
        orderBy: { qrCodeId: "desc" },
      });
    });
  }

  static async updateStatus(id: string, status: "ACTIVE" | "INACTIVE", user: JWTPayload) {
    if (user.role !== "SUPER_ADMIN") {
      throw new Error("Forbidden: Only Super Admins can toggle QR status");
    }

    const qr = await db.qrCode.findFirst({
      where: { id, isDeleted: false },
    });
    if (!qr) {
      throw new Error("QR Code not found");
    }

    return db.qrCode.update({
      where: { id },
      data: { status },
    });
  }

  static async delete(id: string, user: JWTPayload) {
    const qr = await db.qrCode.findFirst({
      where: { id, isDeleted: false },
      include: { campaign: true },
    });
    if (!qr) {
      throw new Error("QR Code not found or already deleted");
    }

    // Check advertiser authorization
    if (user.role === "ADVERTISER" && qr.campaign.advertiserId !== user.advertiserId) {
      throw new Error("Forbidden: Access denied to delete this QR code");
    }

    return db.qrCode.update({
      where: { id },
      data: { isDeleted: true },
    });
  }
}
