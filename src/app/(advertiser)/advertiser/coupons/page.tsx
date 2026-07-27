import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { CouponsClient } from "@/components/coupons-client";

export default async function AdvertiserCouponsPage() {
  const session = await getSession();
  if (!session || session.role !== "ADVERTISER" || !session.advertiserId) {
    redirect("/auth/login");
  }

  // Fetch only this advertiser's active coupons
  const coupons = await db.coupon.findMany({
    where: {
      advertiserId: session.advertiserId,
      isDeleted: false,
    },
    include: { advertiser: true, campaign: true, qrCodes: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <CouponsClient
      initialCoupons={coupons}
      role={session.role}
    />
  );
}
