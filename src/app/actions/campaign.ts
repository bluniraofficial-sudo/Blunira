"use server";

import { getSession } from "@/lib/auth";
import { CampaignService, CreateCampaignInput, UpdateCampaignInput } from "@/services/campaign";
import { revalidatePath } from "next/cache";

export async function createCampaignAction(data: CreateCampaignInput) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const result = await CampaignService.create(data, session);
  revalidatePath("/admin/campaigns");
  revalidatePath("/advertiser/campaigns");
  return result;
}

export async function updateCampaignAction(id: string, data: UpdateCampaignInput) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const result = await CampaignService.update(id, data, session);
  revalidatePath("/admin/campaigns");
  revalidatePath("/advertiser/campaigns");
  return result;
}

export async function deleteCampaignAction(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const result = await CampaignService.delete(id, session);
  revalidatePath("/admin/campaigns");
  revalidatePath("/advertiser/campaigns");
  return result;
}
