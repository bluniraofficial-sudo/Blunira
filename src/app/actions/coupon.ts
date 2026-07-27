"use server";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createCouponAction(data: {
  code: string;
  title: string;
  description?: string;
  discount: string;
  maxRedemptions?: number;
  expiryDate?: string;
  advertiserId: string;
  campaignId?: string | null;
  qrCodeIds?: string[];
}) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

  const expiry = data.expiryDate ? new Date(data.expiryDate) : null;

  const coupon = await db.coupon.create({
    data: {
      code: data.code.toUpperCase().trim(),
      title: data.title,
      description: data.description || null,
      discount: data.discount,
      maxRedemptions: data.maxRedemptions || null,
      expiryDate: expiry,
      advertiserId: data.advertiserId,
      campaignId: data.campaignId || null,
      qrCodes: data.qrCodeIds && data.qrCodeIds.length > 0
        ? { connect: data.qrCodeIds.map((id) => ({ id })) }
        : undefined,
    },
    include: { advertiser: true, campaign: true, qrCodes: true },
  });

  revalidatePath("/admin/coupons");
  revalidatePath("/advertiser/coupons");
  return coupon;
}

export async function updateCouponAction(
  id: string,
  data: {
    code: string;
    title: string;
    description?: string;
    discount: string;
    maxRedemptions?: number;
    expiryDate?: string;
    advertiserId: string;
    campaignId?: string | null;
    qrCodeIds?: string[];
  }
) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

  const expiry = data.expiryDate ? new Date(data.expiryDate) : null;

  const coupon = await db.coupon.update({
    where: { id },
    data: {
      code: data.code.toUpperCase().trim(),
      title: data.title,
      description: data.description || null,
      discount: data.discount,
      maxRedemptions: data.maxRedemptions || null,
      expiryDate: expiry,
      advertiserId: data.advertiserId,
      campaignId: data.campaignId || null,
      qrCodes: data.qrCodeIds
        ? { set: data.qrCodeIds.map((id) => ({ id })) }
        : undefined,
    },
    include: { advertiser: true, campaign: true, qrCodes: true },
  });

  revalidatePath("/admin/coupons");
  revalidatePath("/advertiser/coupons");
  return coupon;
}

export async function linkQrCodesToCouponAction(
  couponId: string,
  qrCodeIds: string[]
) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

  const coupon = await db.coupon.update({
    where: { id: couponId },
    data: {
      qrCodes: { set: qrCodeIds.map((id) => ({ id })) },
    },
    include: { qrCodes: true },
  });

  revalidatePath("/admin/coupons");
  revalidatePath("/advertiser/coupons");
  return coupon;
}

export async function deleteCouponAction(id: string) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

  await db.coupon.update({
    where: { id },
    data: { isDeleted: true },
  });

  revalidatePath("/admin/coupons");
  revalidatePath("/advertiser/coupons");
}

export async function redeemCouponAction(code: string) {
  const session = await getSession();
  if (!session || !session.advertiserId) {
    throw new Error("Unauthorized: Only registered businesses can redeem coupon codes.");
  }

  const cleanedCode = code.toUpperCase().trim();

  const coupon = await db.coupon.findFirst({
    where: {
      code: cleanedCode,
      advertiserId: session.advertiserId,
      isDeleted: false,
    },
    include: {
      campaign: true,
      redemptions: {
        include: {
          lead: true,
        },
      },
    },
  });

  if (!coupon) {
    throw new Error("Coupon code not found or does not belong to your business.");
  }

  if (coupon.currentRedemptions >= (coupon.maxRedemptions || 1)) {
    throw new Error("This coupon code has already been redeemed.");
  }

  if (coupon.expiryDate && coupon.expiryDate < new Date()) {
    throw new Error("This coupon has expired.");
  }

  // Mark as redeemed
  const updatedCoupon = await db.coupon.update({
    where: { id: coupon.id },
    data: {
      currentRedemptions: 1,
    },
  });

  revalidatePath("/advertiser/coupons");

  // Get customer details
  const customerName = coupon.redemptions[0]?.lead?.name || "Customer";

  return {
    success: true,
    message: `Coupon successfully redeemed for ${customerName}!`,
    coupon: updatedCoupon,
    customerName,
  };
}
