import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Retrieve token from cookies
  const token = request.cookies.get("auth_token")?.value;
  const payload = token ? await verifyToken(token) : null;

  // Paths that require Super Admin
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (!payload) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    if (payload.role !== "SUPER_ADMIN") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/auth/login?error=forbidden", request.url));
    }
  }

  // Paths that require Advertiser
  if (pathname.startsWith("/advertiser") || pathname.startsWith("/api/advertiser")) {
    if (!payload) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    if (payload.role !== "ADVERTISER") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/auth/login?error=forbidden", request.url));
    }
  }

  // Paths for Auth (Login, Forgot Password, Reset Password)
  if (pathname.startsWith("/auth/")) {
    // If already logged in, redirect to correct dashboard
    if (payload) {
      if (payload.role === "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      } else if (payload.role === "ADVERTISER") {
        return NextResponse.redirect(new URL("/advertiser/dashboard", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/advertiser/:path*",
    "/auth/:path*",
    "/api/admin/:path*",
    "/api/advertiser/:path*",
  ],
};
