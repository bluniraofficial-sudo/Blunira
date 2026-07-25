"use server";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function markNotificationAsReadAction(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  await db.notification.update({
    where: { id, userId: session.userId },
    data: { isRead: true },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/advertiser/settings");
}
