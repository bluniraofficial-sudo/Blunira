"use server";

import { getSession } from "@/lib/auth";
import { QrCodeService } from "@/services/qrcode";
import { revalidatePath } from "next/cache";

export async function generateQrCodeBatchAction(
  campaignId: string,
  count: number,
  bottleBatch?: string,
  couponId?: string
) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const result = await QrCodeService.generateBatch(campaignId, count, bottleBatch, session, couponId);
  revalidatePath("/admin/qr-codes");
  return result;
}

export async function updateQrCodeStatusAction(id: string, status: "ACTIVE" | "INACTIVE") {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const result = await QrCodeService.updateStatus(id, status, session);
  revalidatePath("/admin/qr-codes");
  return result;
}

export async function deleteQrCodeAction(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const result = await QrCodeService.delete(id, session);
  revalidatePath("/admin/qr-codes");
  return result;
}
