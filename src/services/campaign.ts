import { db } from "@/lib/db";
import { JWTPayload } from "@/lib/auth";

export interface CreateCampaignInput {
  name: string;
  description?: string;
  advertiserId: string;
  startDate?: Date;
  endDate?: Date;
  bannerUrl?: string;
  logoUrl?: string;
  videoUrl?: string;
  landingPage: {
    title: string;
    subtitle?: string;
    offerText?: string;
    imageBanner?: string;
    countdownEnd?: Date;
    leadFormEnabled?: boolean;
    whatsappButton?: boolean;
    whatsappNumber?: string;
    callButton?: boolean;
    callNumber?: string;
    websiteButton?: boolean;
    websiteUrl?: string;
    googleMapsUrl?: string;
    videoUrl?: string;
    termsText?: string;
    privacyText?: string;
  };
}

export interface UpdateCampaignInput {
  name?: string;
  description?: string;
  status?: "ACTIVE" | "INACTIVE";
  startDate?: Date;
  endDate?: Date;
  bannerUrl?: string;
  logoUrl?: string | null;
  videoUrl?: string;
  landingPage?: {
    title?: string;
    subtitle?: string;
    offerText?: string;
    imageBanner?: string;
    countdownEnd?: Date;
    leadFormEnabled?: boolean;
    whatsappButton?: boolean;
    whatsappNumber?: string;
    callButton?: boolean;
    callNumber?: string;
    websiteButton?: boolean;
    websiteUrl?: string;
    googleMapsUrl?: string;
    videoUrl?: string;
    termsText?: string;
    privacyText?: string;
  };
}

export class CampaignService {
  static async getAll(user: JWTPayload) {
    if (user.role === "ADVERTISER") {
      if (!user.advertiserId) throw new Error("Unauthorized advertiser user context");
      return db.campaign.findMany({
        where: {
          advertiserId: user.advertiserId,
          isDeleted: false,
        },
        include: {
          landingPage: true,
          advertiser: true,
          qrCodes: { where: { isDeleted: false } },
          _count: { select: { qrCodes: { where: { isDeleted: false } }, leads: { where: { isDeleted: false } } } },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    // Super Admin: get all campaigns
    return db.campaign.findMany({
      where: { isDeleted: false },
      include: {
        landingPage: true,
        advertiser: true,
        qrCodes: { where: { isDeleted: false } },
        _count: { select: { qrCodes: { where: { isDeleted: false } }, leads: { where: { isDeleted: false } } } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getById(id: string, user: JWTPayload) {
    const campaign = await db.campaign.findFirst({
      where: {
        id,
        isDeleted: false,
      },
      include: {
        landingPage: true,
        advertiser: true,
        coupons: { where: { isDeleted: false } },
      },
    });

    if (!campaign) return null;

    // Enforce Tenant Isolation
    if (user.role === "ADVERTISER" && campaign.advertiserId !== user.advertiserId) {
      throw new Error("Forbidden: Access to this campaign is denied");
    }

    return campaign;
  }

  static async create(data: CreateCampaignInput, user: JWTPayload) {
    if (user.role !== "SUPER_ADMIN") {
      throw new Error("Forbidden: Only Super Admins can create campaigns");
    }

    // Verify Advertiser exists
    const advertiser = await db.advertiser.findFirst({
      where: { id: data.advertiserId, isDeleted: false },
    });
    if (!advertiser) {
      throw new Error("Advertiser not found");
    }

    // Create Campaign and LandingPage inside a Transaction
    return db.$transaction(async (tx: any) => {
      const campaign = await tx.campaign.create({
        data: {
          name: data.name,
          description: data.description,
          advertiserId: data.advertiserId,
          startDate: data.startDate,
          endDate: data.endDate,
          bannerUrl: data.bannerUrl,
          logoUrl: data.logoUrl,
          videoUrl: data.videoUrl,
        },
      });

      const landingPage = await tx.landingPage.create({
        data: {
          campaignId: campaign.id,
          title: data.landingPage.title,
          subtitle: data.landingPage.subtitle,
          imageBanner: data.landingPage.imageBanner || data.bannerUrl, // Use dedicated offer image, fallback to campaign banner
          offerText: data.landingPage.offerText,
          countdownEnd: data.landingPage.countdownEnd,
          leadFormEnabled: data.landingPage.leadFormEnabled ?? true,
          whatsappButton: data.landingPage.whatsappButton ?? false,
          whatsappNumber: data.landingPage.whatsappNumber,
          callButton: data.landingPage.callButton ?? false,
          callNumber: data.landingPage.callNumber,
          websiteButton: data.landingPage.websiteButton ?? false,
          websiteUrl: data.landingPage.websiteUrl,
          googleMapsUrl: data.landingPage.googleMapsUrl,
          videoUrl: data.landingPage.videoUrl || data.videoUrl,
          termsText: data.landingPage.termsText,
          privacyText: data.landingPage.privacyText,
        },
      });

      // Find the highest sequential code in db (e.g. QR000000001)
      const lastQr = await tx.qrCode.findFirst({
        orderBy: { qrCodeId: "desc" },
      });

      let startNum = 0;
      if (lastQr) {
        const match = lastQr.qrCodeId.match(/QR(\d+)/);
        if (match) {
          startNum = parseInt(match[1], 10);
        }
      }

      const nextNum = startNum + 1;
      const qrCodeId = `QR${String(nextNum).padStart(9, "0")}`;

      const qrCode = await tx.qrCode.create({
        data: {
          qrCodeId,
          publicUrl: `/q/${qrCodeId}`,
          campaignId: campaign.id,
          bottleBatch: "Campaign QR",
          status: "ACTIVE",
        },
      });

      return { ...campaign, landingPage, qrCodes: [qrCode] };
    });
  }

  static async update(id: string, data: UpdateCampaignInput, user: JWTPayload) {
    if (user.role !== "SUPER_ADMIN") {
      throw new Error("Forbidden: Only Super Admins can update campaigns");
    }

    const campaign = await db.campaign.findFirst({
      where: { id, isDeleted: false },
    });
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    return db.$transaction(async (tx: any) => {
      // 1. Update Campaign
      const updatedCampaign = await tx.campaign.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          status: data.status,
          startDate: data.startDate,
          endDate: data.endDate,
          bannerUrl: data.bannerUrl,
          logoUrl: data.logoUrl,
          videoUrl: data.videoUrl,
        },
      });

      // 2. Update Landing Page if details provided
      if (data.landingPage) {
        await tx.landingPage.update({
          where: { campaignId: id },
          data: {
            title: data.landingPage.title,
            subtitle: data.landingPage.subtitle,
            imageBanner: data.landingPage.imageBanner || data.bannerUrl || undefined, // Use dedicated offer image, fallback to campaign banner
            offerText: data.landingPage.offerText,
            countdownEnd: data.landingPage.countdownEnd,
            leadFormEnabled: data.landingPage.leadFormEnabled,
            whatsappButton: data.landingPage.whatsappButton,
            whatsappNumber: data.landingPage.whatsappNumber,
            callButton: data.landingPage.callButton,
            callNumber: data.landingPage.callNumber,
            websiteButton: data.landingPage.websiteButton,
            websiteUrl: data.landingPage.websiteUrl,
            googleMapsUrl: data.landingPage.googleMapsUrl,
            videoUrl: data.landingPage.videoUrl || data.videoUrl,
            termsText: data.landingPage.termsText,
            privacyText: data.landingPage.privacyText,
          },
        });
      }

      return updatedCampaign;
    });
  }

  static async delete(id: string, user: JWTPayload) {
    if (user.role !== "SUPER_ADMIN") {
      throw new Error("Forbidden: Only Super Admins can delete campaigns");
    }

    const campaign = await db.campaign.findFirst({
      where: { id, isDeleted: false },
    });
    if (!campaign) {
      throw new Error("Campaign not found or already deleted");
    }

    await db.$transaction(async (tx: any) => {
      // 1. Soft delete Campaign
      await tx.campaign.update({
        where: { id },
        data: { isDeleted: true },
      });

      // 2. Soft delete Landing Page
      await tx.landingPage.updateMany({
        where: { campaignId: id },
        data: { isDeleted: true },
      });

      // 3. Soft delete QR Codes associated with this campaign
      await tx.qrCode.updateMany({
        where: { campaignId: id },
        data: { isDeleted: true },
      });
    });

    return true;
  }
}
