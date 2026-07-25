import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { setSession } from "@/lib/auth";
import * as bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    // Find user (not deleted)
    const user = await db.user.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        isDeleted: false,
      },
      include: {
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Compare passwords
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if advertiser is suspended
    if (user.advertiserId) {
      const advertiser = await db.advertiser.findUnique({
        where: { id: user.advertiserId },
      });
      if (advertiser && advertiser.isDeleted) {
        return NextResponse.json(
          { error: "This advertiser account no longer exists." },
          { status: 403 }
        );
      }
      if (advertiser && advertiser.status === "SUSPENDED") {
        return NextResponse.json(
          { error: "Your advertiser account has been suspended. Please contact support." },
          { status: 403 }
        );
      }
    }

    // Create session (sets HTTP-only cookie)
    await setSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role.name as "SUPER_ADMIN" | "ADVERTISER",
      advertiserId: user.advertiserId,
    });

    // Write audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "USER_LOGIN",
        details: `${user.name} (${user.role.name}) logged in successfully.`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.name,
        advertiserId: user.advertiserId,
      },
    });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
