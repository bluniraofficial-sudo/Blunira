import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { CouponsClient } from "@/components/coupons-client";

export default async function AdminCouponsPage() {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    redirect("/auth/login");
  }

  // Fetch all active coupons
  const coupons = await db.coupon.findMany({
    where: { isDeleted: false },
    include: { advertiser: true, campaign: true, qrCodes: true },
    orderBy: { createdAt: "desc" },
  });

  const advertisers = await db.advertiser.findMany({
    where: { isDeleted: false },
  });

  const campaigns = await db.campaign.findMany({
    where: { isDeleted: false },
    include: { qrCodes: { where: { isDeleted: false } } },
  });

  return (
    <CouponsClient
      initialCoupons={coupons}
      advertisers={advertisers}
      campaigns={campaigns}
      role={session.role}
    />
  );
}
