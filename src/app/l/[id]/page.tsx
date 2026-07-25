import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { LandingPageClient } from "@/components/landing-client";
import { EndedLandingPageClient } from "@/components/ended-landing-client";
import { cookies, headers } from "next/headers";
import { UAParser } from "ua-parser-js";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PublicLandingPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sParams = await searchParams;
  const qrCode = typeof sParams.qr === "string" ? sParams.qr : undefined;

  // Fetch landing page, related campaign, and campaign coupons FIRST
  const landingPage = await db.landingPage.findFirst({
    where: {
      id,
      isDeleted: false,
    },
    include: {
      campaign: {
        include: { 
          advertiser: true,
          coupons: {
            where: { isDeleted: false },
          },
        },
      },
    },
  });

  if (!landingPage) {
    notFound();
  }

  // Double check that campaign and advertiser are active
  const isInactive =
    landingPage.campaign.status !== "ACTIVE" ||
    landingPage.campaign.isDeleted ||
    landingPage.campaign.advertiser.status === "SUSPENDED" ||
    landingPage.campaign.advertiser.isDeleted;

  if (isInactive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent px-4 text-center">
        <div className="bg-[#15171e] border border-white/5 p-8 rounded-3xl max-w-md shadow-2xl">
          <h1 className="text-2xl font-bold text-red-500 mb-3">Promotion Suspended</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            This landing page or associated marketing campaign is currently unavailable. Please check back later.
          </p>
        </div>
      </div>
    );
  }

  const campaignId = landingPage.campaign.id;

  // Auto-delete ONLY expired coupons belonging to THIS specific campaign
  const campaignExpired =
    !!landingPage.campaign.endDate &&
    new Date(landingPage.campaign.endDate) < new Date();

  const autoDeleteWhere: any = {
    campaignId,
    isDeleted: false,
  };
  if (campaignExpired) {
    // All coupons are expired because the campaign itself ended
    // No additional OR needed — delete all active coupons for this campaign
  } else {
    // Only delete individually-expired coupons
    autoDeleteWhere.expiryDate = { lt: new Date() };
  }
  try {
    await db.coupon.updateMany({
      where: autoDeleteWhere,
      data: { isDeleted: true },
    });
  } catch (error) {
    console.error("Auto-deleting expired coupons failed:", error);
  }

  // Re-fetch active coupons after cleanup
  const activeCoupons = await db.coupon.findMany({
    where: {
      campaignId,
      isDeleted: false,
    },
  });

  landingPage.campaign.coupons = activeCoupons;

  const cookieStore = await cookies();
  const headersList = await headers();
  const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0] || headersList.get("x-real-ip") || "127.0.0.1";
  const userAgent = headersList.get("user-agent") || "";

  // Parse UAParser for highly accurate device details
  const parser = new UAParser(userAgent);
  const browserName = parser.getBrowser().name || "Unknown Browser";
  const osName = parser.getOS().name || "Unknown OS";
  let deviceType = parser.getDevice().type || "Desktop";
  if (deviceType === "mobile") deviceType = "Mobile";
  else if (deviceType === "tablet") deviceType = "Tablet";
  else deviceType = "Desktop";

  const formattedDevice = `${deviceType} - ${browserName} on ${osName}`;

  // Fetch accurate location on server load
  let city = null;
  let country = null;
  const ipTrimmed = ipAddress.trim();

  if (ipTrimmed !== "127.0.0.1" && ipTrimmed !== "::1" && !ipTrimmed.startsWith("192.168.") && !ipTrimmed.startsWith("10.") && !ipTrimmed.startsWith("172.16.")) {
    try {
      const geoRes = await fetch(`http://ip-api.com/json/${ipTrimmed}`, { signal: AbortSignal.timeout(2000) });
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData.status === "success") {
          city = geoData.city || null;
          country = geoData.country || null;
        }
      }
    } catch (e) {
      console.error("IP Geolocation API error on landing page server load:", e);
    }
  }

  const finalLocation = city && country ? `${city}, ${country}` : city || country || "Unknown Location";

  const isOfferEnded = !!(
    (landingPage.campaign.endDate && new Date(landingPage.campaign.endDate) < new Date()) ||
    (landingPage.countdownEnd && new Date(landingPage.countdownEnd) < new Date())
  );

  const totalCampaignCoupons = await db.coupon.count({
    where: { campaignId },
  });
  const couponPeriodConcluded = totalCampaignCoupons > 0 && activeCoupons.length === 0;

  if (isOfferEnded) {
    try {
      // 1. Delete the old campaign QR codes (so they no longer scan/track or exist in active pool)
      await db.qrCode.updateMany({
        where: { campaignId, isDeleted: false },
        data: { isDeleted: true },
      });

      // 2. Mark remaining coupons as deleted
      await db.coupon.updateMany({
        where: { campaignId, isDeleted: false },
        data: { isDeleted: true },
      });
    } catch (error) {
      console.error("Cleaning up concluded campaign assets failed:", error);
    }

    // 3. Render client-side Ended component to accurately resolve geolocation and capture lead
    return (
      <EndedLandingPageClient 
        campaignId={campaignId}
        advertiserId={landingPage.campaign.advertiserId}
        companyName={landingPage.campaign.advertiser.companyName}
      />
    );
  }

  const claimedCookie = cookieStore.get(`claimed_campaign_${campaignId}`)?.value;
  let hasSubmitted = claimedCookie === "true";
  let preClaimedCode: string | null = null;
  let preClaimedDiscount: string | null = null;
  let isRedeemed = false;

  if (hasSubmitted) {
    const cookieCode = cookieStore.get(`claimed_code_${campaignId}`)?.value || null;
    if (cookieCode) {
      // Verify the coupon still exists and is not deleted
      const couponRecord = await db.coupon.findFirst({
        where: { code: cookieCode, isDeleted: false },
      });
      if (couponRecord) {
        preClaimedCode = couponRecord.code;
        preClaimedDiscount = couponRecord.discount;
        if (couponRecord.currentRedemptions >= (couponRecord.maxRedemptions || 1)) {
          isRedeemed = true;
        }
      }
      // If couponRecord is null, coupon was deleted (offer ended). 
      // hasSubmitted stays true → will show "Offer Concluded" via preClaimedCode = null
    }
  }

  // Fallback database device check (scoped strictly to this campaign)
  if (!hasSubmitted) {
    const existingLead = await db.lead.findFirst({
      where: {
        campaignId,
        ipAddress: ipTrimmed,
        userAgent,
        isDeleted: false,
      },
      include: {
        redemptions: {
          include: {
            coupon: true,
          },
          orderBy: { redeemedAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existingLead) {
      hasSubmitted = true;
      // Only surface the coupon code if it's still active (not deleted)
      const validRedemption = existingLead.redemptions.find(
        (r: any) => !r.coupon.isDeleted
      );
      if (validRedemption) {
        preClaimedCode = validRedemption.coupon.code;
        preClaimedDiscount = validRedemption.coupon.discount;
        if (validRedemption.coupon.currentRedemptions >= (validRedemption.coupon.maxRedemptions || 1)) {
          isRedeemed = true;
        }
      }
    }
  }

  return (
    <LandingPageClient 
      landingPage={landingPage} 
      qrCode={qrCode} 
      preClaimedCode={preClaimedCode}
      preClaimedDiscount={preClaimedDiscount}
      isOfferEnded={isOfferEnded}
      hasSubmitted={hasSubmitted}
      isRedeemed={isRedeemed}
      couponPeriodConcluded={couponPeriodConcluded}
      serverCity={city}
      serverCountry={country}
      serverDevice={formattedDevice}
      serverIp={ipTrimmed}
    />
  );
}
