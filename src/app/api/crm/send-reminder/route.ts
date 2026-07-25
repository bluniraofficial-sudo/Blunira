import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmailNotification, sendWhatsAppNotification } from "@/lib/notifications";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      leadIds,
      channel,
      offerTitle,
      offerCode,
      offerDiscount,
      customMessage,
      whatsappTemplateType,
      whatsappTemplateName,
      whatsappTemplateVariables,
      whatsappTemplateHasImage,
      whatsappTemplateImageUrl,
    } = await req.json();

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: "Please select at least one lead." }, { status: 400 });
    }

    // Fetch leads
    const leads = await db.lead.findMany({
      where: { id: { in: leadIds }, isDeleted: false },
      include: {
        campaign: {
          include: { advertiser: true },
        },
      },
    });

    let emailsSent = 0;
    let whatsappSent = 0;

    for (const lead of leads) {
      const companyName = lead.campaign.advertiser.companyName || "Our Brand";
      const code = offerCode || "SPECIALOFFER";
      const discountText = offerDiscount || "Special Discount";
      const title = offerTitle || "Exclusive Offer Reminder";
      const note = customMessage || "Don't miss out on this exclusive deal tailored for you!";

      // 1. Email Channel
      if ((channel === "EMAIL" || channel === "BOTH") && lead.email && lead.email !== "device-scan@anonymous.com") {
        const emailSubject = `🎁 Exclusive Offer: ${title} from ${companyName}`;
        const emailBody = `Hi ${lead.name},\n\n${note}\n\nOffer Title: ${title}\nPromo Code: ${code}\nDiscount: ${discountText}\n\nMention code ${code} at checkout to redeem your discount!\n\nBest regards,\n${companyName}`;

        const emailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>${title}</title>
              <style>
                body { margin: 0; padding: 0; background-color: #070b14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6; }
                .email-wrapper { max-width: 600px; margin: 36px auto; background-color: #0f172a; border: 1px solid rgba(6, 182, 212, 0.25); border-radius: 28px; overflow: hidden; box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5); }
                .header-bar { background: linear-gradient(135deg, #091322 0%, #06b6d4 100%); padding: 36px 28px; text-align: center; color: #ffffff; }
                .brand-title { font-size: 26px; font-weight: 900; margin: 0; tracking-tight; letter-spacing: -0.5px; }
                .brand-subtitle { font-size: 11px; text-transform: uppercase; letter-spacing: 3px; opacity: 0.95; margin-top: 6px; font-weight: 800; color: #a5f3fc; }
                .content-body { padding: 36px 28px; text-align: left; }
                .greeting { font-size: 18px; font-weight: 800; color: #ffffff; margin-bottom: 14px; }
                .note-card { font-size: 14px; color: #cbd5e1; line-height: 1.6; margin-bottom: 28px; background: rgba(255, 255, 255, 0.03); padding: 20px; border-radius: 16px; border-left: 4px solid #06b6d4; }
                .offer-card { background: linear-gradient(180deg, rgba(6, 182, 212, 0.12) 0%, rgba(37, 99, 235, 0.06) 100%); border: 2px dashed rgba(6, 182, 212, 0.45); border-radius: 24px; padding: 32px 24px; margin: 28px 0; text-align: center; }
                .offer-tag { font-size: 11px; color: #22d3ee; font-weight: 800; text-transform: uppercase; letter-spacing: 2.5px; margin-bottom: 10px; display: inline-block; background: rgba(6, 182, 212, 0.15); padding: 4px 14px; border-radius: 999px; }
                .offer-heading { font-size: 22px; font-weight: 900; color: #ffffff; margin: 8px 0 16px 0; }
                .code-box { font-size: 32px; font-family: 'Courier New', Courier, monospace; font-weight: 900; color: #38bdf8; margin: 12px 0; letter-spacing: 5px; background: #040812; padding: 12px 24px; border-radius: 16px; border: 1px dashed #06b6d4; display: inline-block; box-shadow: inset 0 2px 6px rgba(0,0,0,0.6); }
                .discount-badge { font-size: 20px; color: #34d399; font-weight: 900; margin-top: 12px; }
                .instructions-card { background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 18px; padding: 20px; margin-top: 28px; }
                .instructions-title { font-size: 13px; font-weight: 800; color: #ffffff; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
                .instruction-step { font-size: 13px; color: #94a3b8; line-height: 1.7; margin-bottom: 6px; }
                .cta-wrapper { text-align: center; margin-top: 32px; }
                .cta-btn { background: linear-gradient(135deg, #06b6d4 0%, #2563eb 100%); color: #ffffff !important; padding: 14px 32px; border-radius: 14px; font-size: 14px; font-weight: 800; text-decoration: none; display: inline-block; box-shadow: 0 8px 24px rgba(6, 182, 212, 0.3); }
                .footer { background-color: #070b14; padding: 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid rgba(255, 255, 255, 0.06); }
              </style>
            </head>
            <body>
              <div class="email-wrapper">
                <div class="header-bar">
                  <div class="brand-title">${companyName}</div>
                  <div class="brand-subtitle">Special Customer Loyalty Offer</div>
                </div>
                <div class="content-body">
                  <div class="greeting">Hello ${lead.name},</div>
                  <div class="note-card">${note}</div>

                  <div class="offer-card">
                    <div class="offer-tag">VIP Exclusive Voucher</div>
                    <div class="offer-heading">${title}</div>
                    <div class="code-box">${code}</div>
                    <div class="discount-badge">💰 Benefit: ${discountText}</div>
                  </div>

                  <div class="instructions-card">
                    <div class="instructions-title">📋 How to Claim Your Offer:</div>
                    <div class="instruction-step">1. Save or copy your unique promo code: <strong>${code}</strong>.</div>
                    <div class="instruction-step">2. Present or mention code <strong>${code}</strong> at purchase checkout.</div>
                    <div class="instruction-step">3. Instantly unlock your <strong>${discountText}</strong> discount on your order!</div>
                  </div>

                  <div class="cta-wrapper">
                    <span class="cta-btn">PROMO CODE: ${code}</span>
                  </div>
                </div>
                <div class="footer">
                  <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
                  <p style="margin-top: 6px; opacity: 0.7;">Sent via Blunira Customer Engagement Platform.</p>
                </div>
              </div>
            </body>
          </html>
        `;

        await sendEmailNotification(lead.email, emailSubject, emailBody, emailHtml, lead.campaign.advertiserId);
        emailsSent++;
      }

      // 2. WhatsApp Channel
      if ((channel === "WHATSAPP" || channel === "BOTH") && lead.phone && lead.phone !== "00000000") {
        const templateType = whatsappTemplateType || "CRM";
        let templateParams: string[] = [];
        let fallbackMediaUrl = "";

        if (whatsappTemplateName) {
          // Dynamic custom template parameters mapping with placeholders substitution
          templateParams = (whatsappTemplateVariables || []).map((v: string) => {
            let val = v;
            val = val.replaceAll("{{name}}", lead.name || "");
            val = val.replaceAll("{{lead.name}}", lead.name || "");
            val = val.replaceAll("{{company}}", companyName);
            val = val.replaceAll("{{companyName}}", companyName);
            val = val.replaceAll("{{title}}", title);
            val = val.replaceAll("{{offerTitle}}", title);
            val = val.replaceAll("{{code}}", code);
            val = val.replaceAll("{{offerCode}}", code);
            val = val.replaceAll("{{discount}}", discountText);
            val = val.replaceAll("{{offerDiscount}}", discountText);
            val = val.replaceAll("{{note}}", note);
            val = val.replaceAll("{{customMessage}}", note);
            return val;
          });
          fallbackMediaUrl = whatsappTemplateImageUrl || "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=600&h=350&q=80";
        } else {
          if (templateType === "CRM") {
            templateParams = [lead.name, note, title, code, discountText, companyName];
            fallbackMediaUrl = "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=600&h=350&q=80";
          } else if (templateType === "COUPON") {
            templateParams = [lead.name, companyName, code];
            fallbackMediaUrl = "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&h=350&q=80";
          } else if (templateType === "REGISTRATION") {
            templateParams = [lead.name, companyName];
            fallbackMediaUrl = "https://images.unsplash.com/photo-1548839134-24a5c474350d?auto=format&fit=crop&w=600&h=350&q=80";
          }
        }

        const whatsAppMsg = `🎉 *EXCLUSIVE OFFER FROM ${companyName.toUpperCase()}* 🎉\n\nHi ${lead.name}!\n${note}\n\n🎁 *YOUR OFFER DETAILS:*\n• *Offer:* ${title}\n• *Promo Code:* \`${code}\`\n• *Discount:* ${discountText}\n\n⚡ *HOW TO REDEEM:*\nMention promo code *${code}* at checkout to instantly claim your *${discountText}* discount!\n\nBest regards,\n*${companyName}*`;

        await sendWhatsAppNotification(
          lead.phone,
          whatsAppMsg,
          templateType,                   // always pass actual type (CRM/COUPON/REGISTRATION) for fallback
          templateParams,
          lead.campaign.advertiserId,
          lead.campaign.bannerUrl || fallbackMediaUrl,
          whatsappTemplateName || undefined,
          whatsappTemplateName
            ? (whatsappTemplateHasImage === "true" || whatsappTemplateHasImage === true)
            : undefined
        );
        whatsappSent++;
      }
    }

    // Log Audit
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: "CRM_REMINDER_SENT",
        details: `Sent offer reminder (${offerTitle}) via ${channel} to ${leads.length} leads.`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Offer reminders successfully dispatched to ${leads.length} customer(s).`,
      stats: { total: leads.length, emailsSent, whatsappSent },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to send CRM reminders" }, { status: 500 });
  }
}
