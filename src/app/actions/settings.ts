"use server";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import * as bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function updateSettingAction(key: string, value: string) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

  await db.settings.update({
    where: { key },
    data: { value },
  });

  revalidatePath("/admin/settings");
}

export async function createUserAction(data: {
  name: string;
  email: string;
  passwordHash: string; // plain text pass sent from client, we hash it here
  roleId: string;
  advertiserId?: string | null;
}) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

  const existing = await db.user.findUnique({
    where: { email: data.email.toLowerCase().trim() },
  });

  if (existing) {
    if (existing.isDeleted) {
      // Recover user
      const passwordHash = await bcrypt.hash(data.passwordHash, 10);
      return db.user.update({
        where: { id: existing.id },
        data: {
          name: data.name,
          passwordHash,
          roleId: data.roleId,
          advertiserId: data.advertiserId || null,
          isDeleted: false,
        },
        include: { role: true, advertiser: true },
      });
    }
    throw new Error("Email address already registered");
  }

  const passwordHash = await bcrypt.hash(data.passwordHash, 10);

  const newUser = await db.user.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase().trim(),
      passwordHash,
      roleId: data.roleId,
      advertiserId: data.advertiserId || null,
    },
    include: { role: true, advertiser: true },
  });

  revalidatePath("/admin/settings");
  return newUser;
}

export async function deleteUserAction(id: string) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

  // Prevent self-deletion
  if (session.userId === id) {
    throw new Error("You cannot delete your own admin account.");
  }

  await db.user.update({
    where: { id },
    data: { isDeleted: true },
  });

  revalidatePath("/admin/settings");
}
