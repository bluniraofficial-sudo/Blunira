import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { LeadService } from "@/services/lead";
import { z } from "zod";

const leadFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(8, "Please enter a valid phone number"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  city: z.string().min(2, "City name must be at least 2 characters").optional().or(z.literal("")),
  consentCheck: z.boolean().refine((val) => val === true, {
    message: "Consent is required to submit the form",
  }),
});

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id: landingPageId } = await props.params;
  const contentType = request.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  try {
    if (!landingPageId) {
      return NextResponse.json({ error: "Landing Page ID is required" }, { status: 400 });
    }

    let body: any = {};
    if (isJson) {
      body = await request.json();
    } else {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries());
      body.consentCheck = body.consentCheck === "on" || body.consentCheck === "true" || body.consentCheck === true;
    }

    const result = leadFormSchema.safeParse(body);

    if (!result.success) {
      if (isJson) {
        return NextResponse.json(
          { error: result.error.issues[0]?.message || "Validation error" },
          { status: 400 }
        );
      } else {
        const errorRedirectUrl = new URL(`/l/${landingPageId}`, request.url);
        errorRedirectUrl.searchParams.set("error", result.error.issues[0]?.message || "Validation error");
        return NextResponse.redirect(errorRedirectUrl);
      }
    }

    // 1. Fetch LandingPage & Campaign context
    const landingPage = await db.landingPage.findFirst({
      where: {
        id: landingPageId,
        isDeleted: false,
      },
      include: {
        campaign: true,
      },
    });

    if (!landingPage) {
      if (isJson) {
        return NextResponse.json({ error: "Landing page not found" }, { status: 404 });
      } else {
        const errorRedirectUrl = new URL(`/l/${landingPageId}`, request.url);
        errorRedirectUrl.searchParams.set("error", "Landing page not found");
        return NextResponse.redirect(errorRedirectUrl);
      }
    }

    if (landingPage.campaign.status !== "ACTIVE" || landingPage.campaign.isDeleted) {
      if (isJson) {
        return NextResponse.json({ error: "This campaign is no longer active" }, { status: 400 });
      } else {
        const errorRedirectUrl = new URL(`/l/${landingPageId}`, request.url);
        errorRedirectUrl.searchParams.set("error", "This campaign is no longer active");
        return NextResponse.redirect(errorRedirectUrl);
      }
    }

    // Auto-delete expired coupons and campaign coupons of expired campaigns
    await db.coupon.updateMany({
      where: {
        campaignId: landingPage.campaignId,
        isDeleted: false,
        OR: [
          { expiryDate: { lt: new Date() } },
          {
            campaign: {
              endDate: { lt: new Date() }
            }
          }
        ]
      },
      data: {
        isDeleted: true,
      },
    });

    // Enforce device constraints using cookies
    const deviceClaimed = request.cookies.get(`claimed_campaign_${landingPage.campaignId}`);
    if (deviceClaimed) {
      if (isJson) {
        return NextResponse.json({ error: "This device has already claimed this promotion." }, { status: 400 });
      } else {
        const errorRedirectUrl = new URL(`/l/${landingPageId}`, request.url);
        errorRedirectUrl.searchParams.set("error", "This device has already claimed this promotion.");
        return NextResponse.redirect(errorRedirectUrl);
      }
    }

    const userAgent = request.headers.get("user-agent") || "";
    let ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "127.0.0.1";
    ipAddress = ipAddress.trim();

    // Read scan city cookie if submitted city is empty
    let submittedCity = result.data.city || undefined;
    if (!submittedCity) {
      const cookieCity = request.cookies.get("last_scan_city")?.value;
      if (cookieCity) {
        submittedCity = cookieCity;
      }
    }

    // 2. Submit Lead via LeadService
    const serviceResult = await LeadService.create({
      name: result.data.name,
      phone: result.data.phone,
      email: result.data.email || undefined,
      city: submittedCity,
      consentCheck: result.data.consentCheck,
      campaignId: landingPage.campaignId,
      ipAddress,
      userAgent,
    });

    if (isJson) {
      const response = NextResponse.json({
        success: true,
        message: "Lead form submitted successfully!",
        couponCode: serviceResult.couponCode,
        discount: serviceResult.discount,
      });
      // Set the claim cookies on success (1 year)
      response.cookies.set(`claimed_campaign_${landingPage.campaignId}`, "true", {
        path: "/",
        maxAge: 31536000,
      });
      if (serviceResult.couponCode) {
        response.cookies.set(`claimed_code_${landingPage.campaignId}`, serviceResult.couponCode, {
          path: "/",
          maxAge: 31536000,
        });
        response.cookies.set(`claimed_discount_${landingPage.campaignId}`, serviceResult.discount?.toString() || "", {
          path: "/",
          maxAge: 31536000,
        });
      }
      return response;
    } else {
      const redirectUrl = new URL(`/l/${landingPageId}`, request.url);
      redirectUrl.searchParams.set("success", "true");
      if (serviceResult.couponCode) {
        redirectUrl.searchParams.set("couponCode", serviceResult.couponCode);
        redirectUrl.searchParams.set("discount", serviceResult.discount?.toString() || "");
      }
      const response = NextResponse.redirect(redirectUrl);
      // Set the claim cookies on success (1 year)
      response.cookies.set(`claimed_campaign_${landingPage.campaignId}`, "true", {
        path: "/",
        maxAge: 31536000,
      });
      if (serviceResult.couponCode) {
        response.cookies.set(`claimed_code_${landingPage.campaignId}`, serviceResult.couponCode, {
          path: "/",
          maxAge: 31536000,
        });
        response.cookies.set(`claimed_discount_${landingPage.campaignId}`, serviceResult.discount?.toString() || "", {
          path: "/",
          maxAge: 31536000,
        });
      }
      return response;
    }
  } catch (error: any) {
    console.error("Lead Submission API Error:", error);
    if (isJson) {
      return NextResponse.json(
        { error: error.message || "Internal Server Error" },
        { status: 500 }
      );
    } else {
      const errorRedirectUrl = new URL(`/l/${landingPageId || ""}`, request.url);
      errorRedirectUrl.searchParams.set("error", error.message || "Internal Server Error");
      return NextResponse.redirect(errorRedirectUrl);
    }
  }
}
