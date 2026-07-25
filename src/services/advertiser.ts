import { db } from "@/lib/db";
import { JWTPayload } from "@/lib/auth";
import * as bcrypt from "bcryptjs";

export class AdvertiserService {
  private static enforceAdmin(user: JWTPayload) {
    if (user.role !== "SUPER_ADMIN") {
      throw new Error("Forbidden: Super Admin access required");
    }
  }

  static async getAll(user: JWTPayload) {
    this.enforceAdmin(user);
    return db.advertiser.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getById(id: string, user: JWTPayload) {
    // If it's an advertiser user, they can only view their own tenant details
    if (user.role === "ADVERTISER" && user.advertiserId !== id) {
      throw new Error("Forbidden: Access to this tenant is denied");
    }
    
    return db.advertiser.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });
  }

  static async create(
    data: {
      name: string;
      companyName: string;
      email: string;
      phone?: string;
      category?: string;
      password?: string;
      couponCode?: string;
      couponDiscount?: string;
      couponTitle?: string;
    },
    user: JWTPayload
  ) {
    this.enforceAdmin(user);

    // Check if email already exists
    const existing = await db.advertiser.findUnique({
      where: { email: data.email },
    });

    let advertiser;

    if (existing) {
      if (existing.isDeleted) {
        // Recover soft deleted tenant
        advertiser = await db.advertiser.update({
          where: { id: existing.id },
          data: {
            name: data.name,
            companyName: data.companyName,
            phone: data.phone,
            category: data.category || null,
            status: "ACTIVE",
            isDeleted: false,
          },
        });
      } else {
        throw new Error("Advertiser email already registered");
      }
    } else {
      advertiser = await db.advertiser.create({
        data: {
          name: data.name,
          companyName: data.companyName,
          email: data.email,
          phone: data.phone,
          category: data.category || null,
        },
      });
    }

    // Automatically create Advertiser User if password is provided
    if (data.password) {
      const advertiserRole = await db.role.findUnique({
        where: { name: "ADVERTISER" },
      });
      if (advertiserRole) {
        const passwordHash = await bcrypt.hash(data.password, 10);
        // Check if there is already a user with this email (recovering deleted or creating new)
        const existingUser = await db.user.findFirst({
          where: { email: data.email.toLowerCase().trim() },
        });

        if (existingUser) {
          await db.user.update({
            where: { id: existingUser.id },
            data: {
              name: data.name,
              passwordHash,
              roleId: advertiserRole.id,
              advertiserId: advertiser.id,
              isDeleted: false,
            },
          });
        } else {
          await db.user.create({
            data: {
              name: data.name,
              email: data.email.toLowerCase().trim(),
              passwordHash,
              roleId: advertiserRole.id,
              advertiserId: advertiser.id,
            },
          });
        }
      }
    }

    // Automatically create default Coupon template if provided
    if (data.couponCode && data.couponDiscount) {
      await db.coupon.create({
        data: {
          code: data.couponCode.toUpperCase().trim(),
          title: data.couponTitle || `${data.couponDiscount} Welcome Discount`,
          discount: data.couponDiscount,
          advertiserId: advertiser.id,
        },
      });
    }

    return advertiser;
  }

  static async update(
    id: string,
    data: {
      name?: string;
      companyName?: string;
      phone?: string;
      category?: string;
      status?: "ACTIVE" | "SUSPENDED";
    },
    user: JWTPayload
  ) {
    this.enforceAdmin(user);

    const advertiser = await db.advertiser.findFirst({
      where: { id, isDeleted: false },
    });
    if (!advertiser) {
      throw new Error("Advertiser not found");
    }

    return db.advertiser.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string, user: JWTPayload) {
    this.enforceAdmin(user);

    const advertiser = await db.advertiser.findFirst({
      where: { id, isDeleted: false },
    });
    if (!advertiser) {
      throw new Error("Advertiser not found or already deleted");
    }

    // Soft delete: set isDeleted = true and cascade soft-delete to users and campaigns
    await db.$transaction(async (tx: any) => {
      // 1. Soft delete advertiser
      await tx.advertiser.update({
        where: { id },
        data: { isDeleted: true },
      });

      // 2. Soft delete related users
      await tx.user.updateMany({
        where: { advertiserId: id },
        data: { isDeleted: true },
      });

      // 3. Soft delete campaigns
      await tx.campaign.updateMany({
        where: { advertiserId: id },
        data: { isDeleted: true },
      });
    });

    return true;
  }
}
