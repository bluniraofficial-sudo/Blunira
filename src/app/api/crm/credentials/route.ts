import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import nodemailer from "nodemailer";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let advertiserId = searchParams.get("advertiserId") || undefined;
    if (session.role === "ADVERTISER") {
      advertiserId = session.advertiserId || undefined;
    }

    const getSetting = async (key: string) => {
      if (advertiserId) {
        const found = await db.settings.findUnique({ where: { key: `${key}_${advertiserId}` } });
        if (found) return found.value;
      }
      const foundGlobal = await db.settings.findUnique({ where: { key } });
      return foundGlobal ? foundGlobal.value : "";
    };

    const smtpUser = await getSetting("SMTP_USER");
    const smtpPass = await getSetting("SMTP_PASS");
    const whatsappApiUrl = await getSetting("WHATSAPP_API_URL");
    const whatsappApiToken = await getSetting("WHATSAPP_API_TOKEN");
    const whatsappUseTemplate = await getSetting("WHATSAPP_USE_TEMPLATE");
    const whatsappTemplateCoupon = await getSetting("WHATSAPP_TEMPLATE_COUPON");
    const whatsappTemplateRegistration = await getSetting("WHATSAPP_TEMPLATE_REGISTRATION");
    const whatsappTemplateCrm = await getSetting("WHATSAPP_TEMPLATE_CRM");
    const whatsappTemplateLanguage = await getSetting("WHATSAPP_TEMPLATE_LANGUAGE");
    const whatsappProvider = await getSetting("WHATSAPP_PROVIDER");
    const whatsappPhoneNumberId = await getSetting("WHATSAPP_PHONE_NUMBER_ID");
    const whatsappWabaId = await getSetting("WHATSAPP_WABA_ID");

    return NextResponse.json({
      smtpUser: smtpUser || process.env.SMTP_USER || "",
      smtpPass: smtpPass || "",
      whatsappApiUrl: whatsappApiUrl || process.env.WHATSAPP_API_URL || "",
      whatsappApiToken: whatsappApiToken || process.env.WHATSAPP_API_TOKEN || "",
      whatsappUseTemplate: whatsappUseTemplate || "false",
      whatsappTemplateCoupon: whatsappTemplateCoupon || "coupon_delivery",
      whatsappTemplateRegistration: whatsappTemplateRegistration || "registration_confirmed",
      whatsappTemplateCrm: whatsappTemplateCrm || "crm_offer_reminder",
      whatsappTemplateLanguage: whatsappTemplateLanguage || "en",
      whatsappProvider: whatsappProvider || "CUSTOM",
      whatsappPhoneNumberId: whatsappPhoneNumberId || "",
      whatsappWabaId: whatsappWabaId || "",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch credentials" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      type,
      smtpUser,
      smtpPass,
      whatsappApiUrl,
      whatsappApiToken,
      whatsappUseTemplate,
      whatsappTemplateCoupon,
      whatsappTemplateRegistration,
      whatsappTemplateCrm,
      whatsappTemplateLanguage,
      whatsappProvider,
      whatsappPhoneNumberId,
      whatsappWabaId,
      whatsappTemplateCouponHasImage,
      whatsappTemplateRegistrationHasImage,
      whatsappTemplateCrmHasImage,
      advertiserId: reqAdvertiserId,
    } = await req.json();

    let advertiserId = reqAdvertiserId || undefined;
    if (session.role === "ADVERTISER") {
      advertiserId = session.advertiserId || undefined;
    }

    const saveSetting = async (key: string, value: string, description: string) => {
      const dbKey = advertiserId ? `${key}_${advertiserId}` : key;
      const desc = description + (advertiserId ? ` (Advertiser override)` : "");
      await db.settings.upsert({
        where: { key: dbKey },
        update: { value },
        create: { key: dbKey, value, description: desc },
      });
    };

    if (type === "EMAIL") {
      if (!smtpUser || !smtpPass) {
        return NextResponse.json(
          { success: false, error: "Please enter both Email and App Password." },
          { status: 400 }
        );
      }

      // Verify SMTP connection
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });
        await transporter.verify();
      } catch (verifyError: any) {
        return NextResponse.json(
          {
            success: false,
            error: `Email Credentials Verification Failed: ${verifyError.message || "Invalid credentials"}`,
          },
          { status: 400 }
        );
      }

      // Save to database
      await saveSetting("SMTP_USER", smtpUser, "SMTP Email User for CRM Reminders");
      await saveSetting("SMTP_PASS", smtpPass, "SMTP App Password for CRM Reminders");

      await db.auditLog.create({
        data: {
          userId: session.userId,
          action: "EMAIL_CREDENTIALS_VERIFIED_AND_SAVED",
          details: `Verified and saved SMTP credentials for email ${smtpUser}` + (advertiserId ? ` for advertiser ${advertiserId}` : ""),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Email SMTP Credentials successfully verified and saved to database!",
      });
    }



    if (type === "WHATSAPP") {
      let resolvedUrl = whatsappApiUrl || "";
      if (whatsappProvider === "META") {
        if (!whatsappPhoneNumberId) {
          return NextResponse.json(
            { success: false, error: "Please enter your WhatsApp Phone Number ID." },
            { status: 400 }
          );
        }
        resolvedUrl = `https://graph.facebook.com/v20.0/${whatsappPhoneNumberId}/messages`;
      }

      if (!resolvedUrl || !whatsappApiToken) {
        return NextResponse.json(
          { success: false, error: "Please enter the required WhatsApp configuration details." },
          { status: 400 }
        );
      }

      // 1. Verify WhatsApp API connectivity
      try {
        let testPayload: any = {};
        let testHeaders: any = { "Content-Type": "application/json" };

        if (whatsappProvider === "META" || resolvedUrl.includes("graph.facebook.com")) {
          testPayload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: "0000000000",
            type: "template",
            template: {
              name: whatsappTemplateRegistration || "registration_confirmed",
              language: {
                code: whatsappTemplateLanguage || "en",
              },
              components: [
                {
                  type: "body",
                  parameters: [
                    { type: "text", text: "Test Name" },
                    { type: "text", text: "Test Brand" },
                  ],
                },
              ],
            },
          };
          testHeaders["Authorization"] = `Bearer ${whatsappApiToken}`;
        } else {
          if (resolvedUrl.includes("ultramsg")) {
            testPayload = { token: whatsappApiToken, to: "0000000000", body: "Verification Test" };
          } else {
            testPayload = { phone: "0000000000", message: "Verification Test" };
            testHeaders["Authorization"] = `Bearer ${whatsappApiToken}`;
          }
        }

        const res = await fetch(resolvedUrl, {
          method: "POST",
          headers: testHeaders,
          body: JSON.stringify(testPayload),
        });

        // Ultramsg or custom webhooks return HTTP 200/400 even for test endpoints.
        // If server connection returns 404 or 502, it means invalid API URL.
        if (res.status === 404 || res.status >= 500) {
          const text = await res.text();
          throw new Error(`Gateway returned HTTP ${res.status}: ${text || "Unable to reach WhatsApp gateway"}`);
        }
      } catch (waError: any) {
        return NextResponse.json(
          {
            success: false,
            error: `WhatsApp API Verification Failed: ${waError.message || "Invalid API URL, Token, or Phone Number ID"}`,
          },
          { status: 400 }
        );
      }

      // 2. Save verified credentials in DB
      await saveSetting("WHATSAPP_API_URL", resolvedUrl, "WhatsApp Business API Endpoint URL");
      await saveSetting("WHATSAPP_API_TOKEN", whatsappApiToken, "WhatsApp Business API Access Token");
      await saveSetting("WHATSAPP_PROVIDER", whatsappProvider || "CUSTOM", "WhatsApp API Provider Type (META/CUSTOM)");
      await saveSetting("WHATSAPP_PHONE_NUMBER_ID", whatsappPhoneNumberId || "", "Meta WhatsApp Phone Number ID");
      await saveSetting("WHATSAPP_WABA_ID", whatsappWabaId || "", "Meta WhatsApp WABA ID");
      await saveSetting("WHATSAPP_USE_TEMPLATE", whatsappUseTemplate || "false", "Use Template for WhatsApp");
      await saveSetting("WHATSAPP_TEMPLATE_COUPON", whatsappTemplateCoupon || "coupon_delivery", "WhatsApp Coupon Delivery Template Name");
      await saveSetting("WHATSAPP_TEMPLATE_REGISTRATION", whatsappTemplateRegistration || "registration_confirmed", "WhatsApp Registration Confirmed Template Name");
      await saveSetting("WHATSAPP_TEMPLATE_CRM", whatsappTemplateCrm || "crm_offer_reminder", "WhatsApp CRM Offer Reminder Template Name");
      await saveSetting("WHATSAPP_TEMPLATE_LANGUAGE", whatsappTemplateLanguage || "en", "WhatsApp Template Language Code");
      await saveSetting("WHATSAPP_TEMPLATE_COUPON_HAS_IMAGE", whatsappTemplateCouponHasImage || "false", "WhatsApp Coupon Delivery Template Has Image Header");
      await saveSetting("WHATSAPP_TEMPLATE_REGISTRATION_HAS_IMAGE", whatsappTemplateRegistrationHasImage || "false", "WhatsApp Registration Confirmed Template Has Image Header");
      await saveSetting("WHATSAPP_TEMPLATE_CRM_HAS_IMAGE", whatsappTemplateCrmHasImage || "false", "WhatsApp CRM Offer Reminder Template Has Image Header");

      await db.auditLog.create({
        data: {
          userId: session.userId,
          action: "WHATSAPP_CREDENTIALS_VERIFIED_AND_SAVED",
          details: `Verified and saved WhatsApp API credentials and template configurations for Provider ${whatsappProvider}` + (advertiserId ? ` for advertiser ${advertiserId}` : ""),
        },
      });

      return NextResponse.json({
        success: true,
        message: "WhatsApp Business API Credentials successfully verified and saved to database!",
      });
    }

    return NextResponse.json({ success: false, error: "Invalid credential verification type." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
