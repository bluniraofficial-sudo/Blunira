import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await props.params;
    const body = await request.json();

    const { ipAddress, city, name, phone, email, userAgent, advertiserId } = body;

    if (!campaignId || !ipAddress) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const ipTrimmed = ipAddress.trim();

    // Look for any existing device scans for this specific IP, user agent and campaign
    const existingLead = await db.lead.findFirst({
      where: {
        campaignId,
        ipAddress: ipTrimmed,
        userAgent: userAgent || "",
        isDeleted: false,
      },
    });

    if (existingLead) {
      // If we are updating with user form details
      const updated = await db.lead.update({
        where: { id: existingLead.id },
        data: {
          name: name || existingLead.name,
          phone: phone || existingLead.phone,
          email: email || existingLead.email,
          city: city || existingLead.city,
        },
      });
      return NextResponse.json({ success: true, leadId: updated.id, updated: true });
    } else {
      // If no lead exists yet, create it
      const created = await db.lead.create({
        data: {
          name: name || "Device Scan Lead",
          phone: phone || "00000000",
          email: email || "device-scan@anonymous.com",
          city: city || "Unknown Location",
          ipAddress: ipTrimmed,
          userAgent: userAgent || "",
          consentCheck: true,
          campaignId,
          advertiserId,
        },
      });
      return NextResponse.json({ success: true, leadId: created.id, created: true });
    }
  } catch (error: any) {
    console.error("Ended Lead capture error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
