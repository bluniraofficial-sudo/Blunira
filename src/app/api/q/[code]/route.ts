import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { UAParser } from "ua-parser-js";

// List of mock cities for localhost development testing
const mockCities = [
  { city: "New York", country: "USA" },
  { city: "Chicago", country: "USA" },
  { city: "San Francisco", country: "USA" },
  { city: "London", country: "UK" },
  { city: "Tokyo", country: "Japan" },
  { city: "Sydney", country: "Australia" },
];

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await props.params;

    if (!code) {
      return NextResponse.json({ error: "QR code parameter is required" }, { status: 400 });
    }

    // 1. Fetch QR Code details
    const qrCode = await db.qrCode.findFirst({
      where: {
        qrCodeId: code.toUpperCase().trim(),
        isDeleted: false,
      },
      include: {
        campaign: {
          include: {
            landingPage: true,
            advertiser: true,
          },
        },
      },
    });

    // Helper to construct redirection URLs
    const getRedirectUrl = (path: string) => {
      return new URL(path, request.nextUrl.origin);
    };

    // Handle missing or inactive QR / Campaign / Advertiser
    if (!qrCode) {
      return NextResponse.redirect(getRedirectUrl("/404"));
    }

    if (
      qrCode.status !== "ACTIVE" ||
      qrCode.campaign.status !== "ACTIVE" ||
      qrCode.campaign.isDeleted ||
      qrCode.campaign.advertiser.status === "SUSPENDED" ||
      qrCode.campaign.advertiser.isDeleted
    ) {
      // Redirect to an inactive notice page or standard 404
      return new NextResponse(
        `<html>
          <head>
            <title>Campaign Inactive</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: -apple-system, sans-serif; background: #0d0e12; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
              div { padding: 2rem; background: #15171e; border: 1px solid #1e222b; border-radius: 1.5rem; max-width: 400px; }
              h1 { font-size: 1.5rem; margin-bottom: 1rem; color: #f43f5e; }
              p { color: #9ca3af; font-size: 0.9rem; line-height: 1.5; }
            </style>
          </head>
          <body>
            <div>
              <h1>Campaign Inactive</h1>
              <p>This promotion QR code is currently inactive or has concluded. Please check the bottle or contact support if you believe this is an error.</p>
            </div>
          </body>
        </html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }

    const campaign = qrCode.campaign;
    if (!campaign.landingPage) {
      return NextResponse.redirect(getRedirectUrl("/404"));
    }

    // 2. Parse User-Agent
    const userAgentStr = request.headers.get("user-agent") || "";
    const parser = new UAParser(userAgentStr);
    const browser = parser.getBrowser().name || "Unknown";
    const os = parser.getOS().name || "Unknown";
    
    let deviceType = parser.getDevice().type || "Desktop";
    if (deviceType === "mobile") {
      deviceType = "Mobile";
    } else if (deviceType === "tablet") {
      deviceType = "Tablet";
    } else {
      deviceType = "Desktop";
    }

    // 3. Extract IP address & Geolocation
    let ip = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "127.0.0.1";
    ip = ip.trim();

    let city = request.headers.get("x-vercel-ip-city") || null;
    let country = request.headers.get("x-vercel-ip-country") || null;

    // If geolocation headers are missing (e.g. outside Vercel, during local dev/tunnel testing)
    if (!city || !country) {
      if (ip !== "127.0.0.1" && ip !== "::1" && !ip.startsWith("192.168.") && !ip.startsWith("10.") && !ip.startsWith("172.16.")) {
        try {
          const geoRes = await fetch(`http://ip-api.com/json/${ip}`, { signal: AbortSignal.timeout(2000) });
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData.status === "success") {
              city = geoData.city || null;
              country = geoData.country || null;
            }
          }
        } catch (e) {
          console.error("IP Geolocation API error:", e);
        }
      }

      // If still null (e.g. rate limit, local IP, or network error), use mock data in development
      if (!city || !country) {
        const mockLoc = mockCities[Math.floor(Math.random() * mockCities.length)];
        city = mockLoc.city;
        country = mockLoc.country;
      }
    }

    // 4. Save scan statistics in database
    await db.$transaction(async (tx: any) => {
      // Create QrScan
      await tx.qrScan.create({
        data: {
          qrCodeId: qrCode.qrCodeId,
          ipAddress: ip,
          userAgent: userAgentStr,
          deviceType,
          os,
          browser,
          city,
          country,
        },
      });

      // Increment scan count and update lastScan time
      await tx.qrCode.update({
        where: { id: qrCode.id },
        data: {
          scanCount: { increment: 1 },
          lastScan: new Date(),
        },
      });
    });

    // 5. Redirect customer to the campaign landing page using original proxy host
    const landingUrl = getRedirectUrl(`/l/${campaign.landingPage.id}`);
    landingUrl.searchParams.set("qr", qrCode.qrCodeId);

    return NextResponse.redirect(landingUrl);
  } catch (error) {
    console.error("QR Scan Redirect Error:", error);
    return NextResponse.redirect(new URL("/500", request.nextUrl.origin));
  }
}
