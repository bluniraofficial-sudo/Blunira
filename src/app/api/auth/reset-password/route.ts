import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as bcrypt from "bcryptjs";
import { z } from "zod";

const resetSchema = z.object({
  token: z.string().uuid("Invalid reset token format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = resetSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    const { token, password } = result.data;

    // Find the user with a valid, non-expired token
    const user = await db.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
        isDeleted: false,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset token." },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update password and clear reset token fields
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // Write audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "PASSWORD_RESET_SUCCESS",
        details: "Password was reset successfully using token.",
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successful. You can now log in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
