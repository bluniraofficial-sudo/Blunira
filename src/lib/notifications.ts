import nodemailer from "nodemailer";
import { db } from "@/lib/db";
import fs from "fs";

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
  } catch {
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
  const wabaId = await getDbSetting("WHATSAPP_WABA_ID", process.env.WHATSAPP_WABA_ID || "", advertiserId);
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
    let payload: Record<string, unknown> = {};
    const headers: Record<string, string> = { "Content-Type": "application/json" };
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

      let resolvedLanguageCode = languageCode;
      let resolvedHasImageHeader = hasImageHeader;

      if (isMeta && wabaId && token) {
        try {
          console.log(`[WhatsApp Audit Log] Fetching approved template metadata from Meta for template: "${templateName}"`);
          const metaTemplatesUrl = `https://graph.facebook.com/v20.0/${wabaId}/message_templates?name=${templateName}`;
          console.log(`[WhatsApp Audit Log] Meta Template Fetch URL: ${metaTemplatesUrl}`);

          const tempRes = await fetch(metaTemplatesUrl, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (tempRes.ok) {
            const tempJson = await tempRes.json();
            console.log(`[WhatsApp Audit Log] Meta Template Fetch Response: ${JSON.stringify(tempJson)}`);
            
            const rawData = tempJson?.data;
            const templateData = Array.isArray(rawData) 
              ? (rawData.find(
                  (t: unknown) => 
                    t && typeof t === "object" && (t as Record<string, unknown>).name === templateName && (t as Record<string, unknown>).status === "APPROVED"
                ) as Record<string, unknown> | undefined)
              : undefined;

            if (templateData) {
              // Align language code
              resolvedLanguageCode = typeof templateData.language === "string" ? templateData.language : languageCode;
              console.log(`[WhatsApp Audit Log] Aligned language code with approved Meta template: "${resolvedLanguageCode}"`);

              // Check if approved template contains a header parameter of type IMAGE
              const componentsList = templateData.components as Record<string, unknown>[] | undefined;
              const hasMetaImageHeader = componentsList?.some(
                (c: Record<string, unknown>) => c.type === "HEADER" && c.format === "IMAGE"
              );

              if (!hasMetaImageHeader && resolvedHasImageHeader) {
                console.log(`[WhatsApp Audit Log] Mismatch Detected: Request specifies image header, but Meta approved template does NOT contain an IMAGE HEADER. Automatically removing header component to prevent delivery failure.`);
                resolvedHasImageHeader = false;
              } else if (hasMetaImageHeader && !resolvedHasImageHeader) {
                console.log(`[WhatsApp Audit Log] Mismatch Detected: Request does not specify image header, but Meta approved template REQUIRES an IMAGE HEADER. Automatically enabling header component.`);
                resolvedHasImageHeader = true;
              }
            } else {
              console.warn(`[WhatsApp Audit Log] Approved template "${templateName}" not found in WABA account. Proceeding with current parameters.`);
            }
          } else {
            const tempErrText = await tempRes.text();
            console.error(`[WhatsApp Audit Log] Failed to fetch template definition from Meta API: Status ${tempRes.status} - ${tempErrText}`);
          }
        } catch (err: unknown) {
          console.error(`[WhatsApp Audit Log] Error during Meta template validation:`, err);
        }
      }

      if (isMeta) {
        const components: Record<string, unknown>[] = [];

        // Only add header component if template has an image header
        if (resolvedHasImageHeader) {
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
            language: { code: resolvedLanguageCode },
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
          language: resolvedLanguageCode,
          vars: templateParams || [],
        };
      } else {
        payload = {
          phone: cleanPhone,
          template: templateName,
          language: resolvedLanguageCode,
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

    console.log(`[WhatsApp Notification Request] URL: ${actualApiUrl}`);
    console.log(`[WhatsApp Notification Request] Headers: ${JSON.stringify({ ...headers, Authorization: headers.Authorization ? "Bearer [HIDDEN]" : undefined })}`);
    console.log(`[WhatsApp Notification Request] Payload: ${JSON.stringify(payload, null, 2)}`);

    const res = await fetch(actualApiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const responseText = await res.text();
    console.log(`[WhatsApp Notification Response] HTTP Status: ${res.status}`);
    console.log(`[WhatsApp Notification Response] Body: ${responseText}`);

    let wamid = "N/A";
    let errorCode = "N/A";
    let errorMessage = "N/A";

    try {
      const parsed = JSON.parse(responseText) as Record<string, unknown>;
      const rawMessages = parsed.messages;
      if (Array.isArray(rawMessages) && rawMessages[0]) {
        const msg = rawMessages[0] as Record<string, unknown>;
        wamid = typeof msg.id === "string" ? msg.id : "N/A";
      }
      const rawError = parsed.error;
      if (rawError && typeof rawError === "object") {
        const errObj = rawError as Record<string, unknown>;
        errorCode = errObj.code !== undefined ? String(errObj.code) : "N/A";
        errorMessage = typeof errObj.message === "string" ? errObj.message : "N/A";
      }
    } catch {}

    console.log(`[WhatsApp Audit Log Results]`);
    console.log(`- HTTP Status: ${res.status}`);
    console.log(`- Message ID (wamid): ${wamid}`);
    console.log(`- Error Code: ${errorCode}`);
    console.log(`- Error Message: ${errorMessage}`);

    fs.appendFileSync('debug_whatsapp.log', `[${new Date().toISOString()}] PAYLOAD: ${JSON.stringify(payload)} | STATUS: ${res.status} | RESPONSE: ${responseText} | WAMID: ${wamid} | ERROR_CODE: ${errorCode} | ERROR_MSG: ${errorMessage}\n`);

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

      return false;
    }
  } catch (error) {
    console.error("[WhatsApp Notification] Failed to dispatch via gateway:", error);
    return false;
  }
}


