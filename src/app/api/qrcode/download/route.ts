import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  let fallbackUrl = "";
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code") || "QRCODE";
    const batch = searchParams.get("batch") || "batch";
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json({ error: "URL query parameter is required" }, { status: 400 });
    }

    fallbackUrl = url;

    // Fetch the QR code image from the generator (e.g. Google Charts API) with browser headers
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
      next: { revalidate: 3600 } // Cache locally
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch QR code image from generator: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const headers = new Headers();
    headers.set("Content-Type", "image/png");
    headers.set(
      "Content-Disposition",
      `attachment; filename="${code.toUpperCase()}_${batch.replace(/\s+/g, "_")}.png"`
    );

    return new NextResponse(Buffer.from(arrayBuffer), {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("QR Code Download Proxy Error:", error);
    
    // Fallback: Redirect directly to the QR code image url as a failsafe
    if (fallbackUrl) {
      return NextResponse.redirect(new URL(fallbackUrl));
    }

    return NextResponse.json({ error: "Failed to download QR code" }, { status: 500 });
  }
}
