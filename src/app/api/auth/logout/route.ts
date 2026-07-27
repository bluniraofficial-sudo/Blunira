import { NextRequest, NextResponse } from "next/server";
import { getSession, clearSessionCookie } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (session) {
      await db.auditLog.create({
        data: {
          userId: session.userId,
          action: "USER_LOGOUT",
          details: `${session.name} logged out successfully.`,
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        },
      });
    }

    const response = NextResponse.json({ success: true, message: "Logged out successfully" });
    clearSessionCookie(response);
    return response;
  } catch (error) {
    console.error("Logout API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const response = NextResponse.redirect(new URL("/auth/login", request.nextUrl.origin));
    clearSessionCookie(response);
    return response;
  } catch (error) {
    console.error("Logout GET error:", error);
    return NextResponse.redirect(new URL("/auth/login", request.nextUrl.origin));
  }
}
