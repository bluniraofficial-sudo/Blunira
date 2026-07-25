import nodemailer from "nodemailer";
import { db } from "@/lib/db";

// Helper function to get setting from DB with fallback to process.env
async function getDbSetting(key: string, fallback: string = "", advertiserId?: string): Promise<string> {
  try {
    if (advertiserId) {
      const advKey = `${key}_${advertiserId}`;
      const advSetting = await db.settings.findUnique({ where: { key: advKey } });
      if (advSetting && advSetting.value) return advSetting.value;
    }
    const setting = await db.settings.findUnique({ where: { key } });
    if (setting && setting.value) return setting.value;
  } catch (error) {
    // ignore db error fallback
  }
  return fallback;
}

/**
 * Send an email notification to the customer
 */
export async function sendEmailNotification(
  to: string,
  subject: string,
  text: string,
  html?: string,
  advertiserId?: string,
  fromName?: string
) {
  if (!to || to === "no-email@provided.com") {
    console.log("[Email Notification] Skipped: No valid email provided.");
    return false;
  }

  const smtpUser = await getDbSetting("SMTP_USER", process.env.SMTP_USER || "blunira.official@gmail.com", advertiserId);
  const smtpPass = await getDbSetting("SMTP_PASS", process.env.SMTP_PASS || "bcgh ywmr fduc wbyh", advertiserId);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"${fromName || "AquaFlow Hydration Corp"}" <${smtpUser}>`,
      to,
      subject,
      text,
      html,
    });
    console.log(`[Email Notification] Email sent successfully: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("[Email Notification] Failed to send email:", error);
    return false;
  }
}

/**
 * Send a WhatsApp message to the customer (via configurable API, supporting approved templates)
 */
export async function sendWhatsAppNotification(
  to: string,
  text: string,
  templateType?: "COUPON" | "REGISTRATION" | "CRM" | string,
  templateParams?: string[],
  advertiserId?: string,
  mediaUrl?: string,
  customTemplateName?: string,
  customHasImageHeader?: boolean
) {
  const apiUrl = await getDbSetting("WHATSAPP_API_URL", process.env.WHATSAPP_API_URL || "", advertiserId);
  const token = await getDbSetting("WHATSAPP_API_TOKEN", process.env.WHATSAPP_API_TOKEN || "", advertiserId);
  const useTemplate = (await getDbSetting("WHATSAPP_USE_TEMPLATE", "false", advertiserId)) === "true";
  const provider = await getDbSetting("WHATSAPP_PROVIDER", "CUSTOM", advertiserId);
  const isMeta = provider === "META" || apiUrl.includes("graph.facebook.com");

  // Format phone number to clean digit string (e.g. 91XXXXXXXXXX)
  let cleanPhone = to.replace(/\D/g, "");
  if (cleanPhone.length === 10) {
    cleanPhone = `91${cleanPhone}`;
  }

  console.log(`[WhatsApp Notification Log] Sending message to ${cleanPhone}: useTemplate=${useTemplate}, templateType=${templateType}, customTemplateName=${customTemplateName}, provider=${provider}, isMeta=${isMeta}`);

  if (!apiUrl || !token) {
    console.log("[WhatsApp Notification] No WHATSAPP_API_URL or WHATSAPP_API_TOKEN set in DB or .env. Message is logged but not dispatched.");
    return false;
  }

  // Determine if we should send as template:
  // 1. If a customTemplateName is explicitly provided — always template
  // 2. If useTemplate is enabled in settings AND a standard templateType is given
  // 3. If isMeta AND a standard templateType (CRM/COUPON/REGISTRATION) is given — Meta only allows template messages to non-initiating contacts
  const isStandardTemplate = templateType === "CRM" || templateType === "COUPON" || templateType === "REGISTRATION";
  const shouldSendAsTemplate = !!(
    customTemplateName ||
    (useTemplate && templateType) ||
    (isMeta && isStandardTemplate)
  );

  try {
    let payload: any = {};
    let headers: any = { "Content-Type": "application/json" };
    let actualApiUrl = apiUrl;

    if (shouldSendAsTemplate) {
      const languageCode = await getDbSetting("WHATSAPP_TEMPLATE_LANGUAGE", "en", advertiserId);
      let templateName = customTemplateName || "";
      let hasImageHeader = customHasImageHeader !== undefined ? customHasImageHeader : false;

      if (!customTemplateName) {
        if (templateType === "COUPON") {
          templateName = await getDbSetting("WHATSAPP_TEMPLATE_COUPON", "coupon_delivery", advertiserId);
          hasImageHeader = (await getDbSetting("WHATSAPP_TEMPLATE_COUPON_HAS_IMAGE", "false", advertiserId)) === "true";
        } else if (templateType === "REGISTRATION") {
          templateName = await getDbSetting("WHATSAPP_TEMPLATE_REGISTRATION", "registration_confirmed", advertiserId);
          hasImageHeader = (await getDbSetting("WHATSAPP_TEMPLATE_REGISTRATION_HAS_IMAGE", "false", advertiserId)) === "true";
        } else if (templateType === "CRM") {
          templateName = await getDbSetting("WHATSAPP_TEMPLATE_CRM", "crm_offer_reminder", advertiserId);
          hasImageHeader = (await getDbSetting("WHATSAPP_TEMPLATE_CRM_HAS_IMAGE", "false", advertiserId)) === "true";
        } else {
          // Fallback if templateType is arbitrary/custom but no name provided
          templateName = templateType || "";
        }
      }

      if (!templateName) {
        console.error("[WhatsApp Notification] No template name resolved. Cannot send template message. Please configure a WhatsApp template name in API Setup settings.");
        return false;
      }

      console.log(`[WhatsApp Notification] Sending template: "${templateName}", language: "${languageCode}", hasImage: ${hasImageHeader}, params: ${JSON.stringify(templateParams)}`);

      if (isMeta) {
        const components: any[] = [];

        // Only add header component if template has an image header
        if (hasImageHeader) {
          const resolvedMediaUrl = mediaUrl || "https://images.unsplash.com/photo-1548839134-24a5c474350d?auto=format&fit=crop&w=600&h=350&q=80";
          components.push({
            type: "header",
            parameters: [
              {
                type: "image",
                image: { link: resolvedMediaUrl },
              },
            ],
          });
        }

        // Only add body parameters if there are any variables
        if (templateParams && templateParams.length > 0) {
          components.push({
            type: "body",
            parameters: templateParams.map((p) => ({
              type: "text",
              text: String(p),
            })),
          });
        }

        payload = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanPhone,
          type: "template",
          template: {
            name: templateName,
            language: { code: languageCode },
            ...(components.length > 0 ? { components } : {}),
          },
        };
        headers["Authorization"] = `Bearer ${token}`;

        console.log(`[WhatsApp Notification] Meta payload: ${JSON.stringify(payload)}`);
      } else if (apiUrl.includes("ultramsg")) {
        if (apiUrl.endsWith("/messages/chat")) {
          actualApiUrl = apiUrl.replace("/messages/chat", "/messages/template");
        }
        payload = {
          token,
          to: cleanPhone,
          template_id: templateName,
          language: languageCode,
          vars: templateParams || [],
        };
      } else {
        payload = {
          phone: cleanPhone,
          template: templateName,
          language: languageCode,
          parameters: templateParams || [],
        };
        headers["Authorization"] = `Bearer ${token}`;
      }
    } else {
      // Freeform chat message fallback
      console.log(`[WhatsApp Notification] Sending freeform text message to ${cleanPhone}`);
      if (isMeta) {
        payload = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanPhone,
          type: "text",
          text: { body: text },
        };
        headers["Authorization"] = `Bearer ${token}`;
      } else if (apiUrl.includes("ultramsg")) {
        payload = {
          token,
          to: cleanPhone,
          body: text,
        };
      } else {
        payload = {
          phone: cleanPhone,
          message: text,
        };
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    const res = await fetch(actualApiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const responseText = await res.text();
    require('fs').appendFileSync('debug_whatsapp.log', `[${new Date().toISOString()}] PAYLOAD: ${JSON.stringify(payload)} | STATUS: ${res.status} | RESPONSE: ${responseText}\n`);
    if (res.ok) {
      console.log(`[WhatsApp Notification] WhatsApp sent successfully to ${cleanPhone}`);
      return true;
    } else {
      console.error(`[WhatsApp Notification] Gateway returned error code: ${res.status} - ${responseText}`);

      // If the advertiser-specific token is expired/invalid (401), fall back to global credentials!
      if (res.status === 401 && advertiserId) {
        console.warn(`[WhatsApp Notification] Advertiser token rejected (401). Retrying with global credentials...`);
        return await sendWhatsAppNotification(
          to,
          text,
          templateType,
          templateParams,
          undefined, // Passing undefined forces global settings fallback
          mediaUrl,
          customTemplateName,
          customHasImageHeader
        );
      }

      // Fallback text dispatch removed: when a template fails (e.g. due to parameter mismatch),
      // we shouldn't send the long freeform text because the user receives it instead of the template
      // and thinks the system attached "custom data" to their template payload.
      return false;
    }
  } catch (error) {
    console.error("[WhatsApp Notification] Failed to dispatch via gateway:", error);
    return false;
  }
}


