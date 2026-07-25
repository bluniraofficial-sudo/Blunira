"use server";

import { getSession } from "@/lib/auth";
import { AdvertiserService } from "@/services/advertiser";
import { revalidatePath } from "next/cache";

export async function createAdvertiserAction(data: {
  name: string;
  companyName: string;
  email: string;
  phone?: string;
  category?: string;
  password?: string;
  couponCode?: string;
  couponDiscount?: string;
  couponTitle?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  
  const result = await AdvertiserService.create(data, session);
  revalidatePath("/admin/advertisers");
  return result;
}

export async function updateAdvertiserAction(
  id: string,
  data: {
    name?: string;
    companyName?: string;
    phone?: string;
    category?: string;
    status?: "ACTIVE" | "SUSPENDED";
  }
) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const result = await AdvertiserService.update(id, data, session);
  revalidatePath("/admin/advertisers");
  return result;
}

export async function deleteAdvertiserAction(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const result = await AdvertiserService.delete(id, session);
  revalidatePath("/admin/advertisers");
  return result;
}
