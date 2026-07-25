import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { qrCodeId, ipAddress, city, country, deviceType, browser, os } = await request.json();

    if (!qrCodeId) {
      return NextResponse.json({ error: "QR Code ID is required" }, { status: 400 });
    }

    // Find the latest scan for this QR Code
    const latestScan = await db.qrScan.findFirst({
      where: { qrCodeId },
      orderBy: { scannedAt: "desc" },
    });

    if (latestScan) {
      await db.qrScan.update({
        where: { id: latestScan.id },
        data: {
          ipAddress: ipAddress || latestScan.ipAddress,
          city: city || latestScan.city,
          country: country || latestScan.country,
          deviceType: deviceType || latestScan.deviceType,
          browser: browser || latestScan.browser,
          os: os || latestScan.os,
        },
      });

      // Also update parent QrCode's lastScan field
      await db.qrCode.update({
        where: { qrCodeId },
        data: {
          lastScan: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Scan update API error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
