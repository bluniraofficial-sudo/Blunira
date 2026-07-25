import { db } from "@/lib/db";
import { JWTPayload } from "@/lib/auth";
import { sendEmailNotification, sendWhatsAppNotification } from "@/lib/notifications";

export interface CreateLeadInput {
  name: string;
  phone: string;
  email?: string;
  city?: string;
  consentCheck: boolean;
  campaignId: string;
  ipAddress?: string;
  userAgent?: string;
}

export class LeadService {
  static async getAll(user: JWTPayload) {
    if (user.role === "ADVERTISER") {
      if (!user.advertiserId) throw new Error("Unauthorized advertiser context");
      return db.lead.findMany({
        where: {
          advertiserId: user.advertiserId,
          isDeleted: false,
        },
        include: {
          campaign: true,
          redemptions: {
            include: { coupon: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    // Super Admin: get all leads
    return db.lead.findMany({
      where: { isDeleted: false },
      include: {
        campaign: true,
        advertiser: true,
        redemptions: {
          include: { coupon: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async create(data: CreateLeadInput) {
    // 1. Find Campaign and Advertiser context
    const campaign = await db.campaign.findFirst({
      where: { id: data.campaignId, isDeleted: false },
      include: {
        advertiser: true,
        coupons: {
          where: { isDeleted: false },
        },
      },
    });

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    if (campaign.status !== "ACTIVE" || campaign.advertiser.status === "SUSPENDED") {
      throw new Error("This campaign is currently inactive.");
    }

    // Enforce unique phone check per campaign
    const existingLead = await db.lead.findFirst({
      where: {
        phone: data.phone,
        campaignId: data.campaignId,
        isDeleted: false,
      },
    });
    if (existingLead) {
      throw new Error("This phone number has already been used to claim this promotion.");
    }

    // Enforce unique device check via IP & User Agent fallback
    if (data.ipAddress && data.userAgent) {
      const existingDeviceLead = await db.lead.findFirst({
        where: {
          campaignId: data.campaignId,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          isDeleted: false,
        },
      });
      if (existingDeviceLead) {
        throw new Error("This device has already claimed this promotion.");
      }
    }

    return db.$transaction(async (tx: any) => {
      // 2. Create Lead
      const lead = await tx.lead.create({
        data: {
          name: data.name,
          phone: data.phone,
          email: data.email?.toLowerCase().trim() || null,
          city: data.city || null,
          consentCheck: data.consentCheck,
          campaignId: data.campaignId,
          advertiserId: campaign.advertiserId,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
        },
      });

      let couponRewarded = null;

      // 3. Find active coupon template in the campaign
      const activeCoupon = campaign.coupons.find((c: any) => {
        const notExpired = !c.expiryDate || c.expiryDate > new Date();
        return notExpired;
      });

      if (activeCoupon) {
        // Generate unique coupon code suffix
        const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
        const uniqueCode = `${activeCoupon.code}-${randomSuffix}`;

        // Create the unique coupon record
        const uniqueCoupon = await tx.coupon.create({
          data: {
            code: uniqueCode,
            title: activeCoupon.title,
            description: activeCoupon.description,
            discount: activeCoupon.discount,
            maxRedemptions: 1, // Only redeemable once
            currentRedemptions: 0, // Unredeemed initially
            expiryDate: activeCoupon.expiryDate,
            advertiserId: activeCoupon.advertiserId,
            campaignId: activeCoupon.campaignId,
          },
        });

        // Record the claim relationship
        await tx.couponRedemption.create({
          data: {
            couponId: uniqueCoupon.id,
            leadId: lead.id,
          },
        });

        couponRewarded = uniqueCoupon;
      }

      // 4. Send WhatsApp & Email notifications (either Coupon Claim or Enquiry Registration)
      const isRewardsCampaign = campaign.coupons && campaign.coupons.length > 0;

      if (isRewardsCampaign && couponRewarded) {
        // Send Coupon Delivery Notifications
        const emailSubject = `Your ${couponRewarded.discount || ""} Coupon for ${campaign.advertiser.companyName}!`;
        const emailBody = `Hi ${lead.name},\n\nThank you for scanning our QR code.\n\nHere is your unique discount code: ${couponRewarded.code}\n\nShow this code or QR at the counter to redeem your discount!\n\nBest regards,\n${campaign.advertiser.companyName}`;
        
        const emailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Your Exclusive Reward</title>
              <style>
                body { margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6; }
                .email-container { max-width: 600px; margin: 40px auto; background-color: #111827; border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4); }
                .header { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 32px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
                .brand-title { font-size: 24px; font-weight: 800; color: #22d3ee; margin: 0; letter-spacing: -0.5px; }
                .brand-subtitle { font-size: 12px; color: #4b5563; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
                .content { padding: 40px 32px; text-align: center; }
                .greeting { font-size: 18px; font-weight: 600; color: #ffffff; margin-bottom: 16px; text-align: left; }
                .intro { font-size: 14px; color: #9ca3af; line-height: 1.6; margin-bottom: 32px; text-align: left; }
                .voucher-card { background: rgba(6, 182, 212, 0.03); border: 2px dashed rgba(6, 182, 212, 0.3); border-radius: 16px; padding: 24px; margin: 32px 0; text-align: center; }
                .voucher-title { font-size: 12px; color: #06b6d4; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; }
                .voucher-code { font-size: 32px; font-family: 'Courier New', Courier, monospace; font-weight: 800; color: #22d3ee; margin: 8px 0; letter-spacing: 3px; }
                .voucher-discount { font-size: 16px; color: #ffffff; font-weight: 600; margin-top: 4px; }
                .instructions { font-size: 13px; color: #9ca3af; line-height: 1.5; margin-top: 24px; text-align: left; background: rgba(255, 255, 255, 0.02); padding: 16px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.04); }
                .instruction-header { font-weight: 700; color: #ffffff; margin-bottom: 8px; }
                .footer { background-color: #0b0f19; padding: 24px; text-align: center; font-size: 12px; color: #4b5563; border-top: 1px solid rgba(255, 255, 255, 0.05); }
                .footer p { margin: 4px 0; }
              </style>
            </head>
            <body>
              <div class="email-container">
                <div class="header">
                  <div class="brand-title">${campaign.advertiser.companyName}</div>
                  <div class="brand-subtitle">Exclusive Scan Reward</div>
                </div>
                <div class="content">
                  <div class="greeting">Hello ${lead.name},</div>
                  <div class="intro">Thank you for scanning our product QR code! We are excited to offer you a special reward as part of our customer loyalty program. Here are your coupon details:</div>
                  
                  <div class="voucher-card">
                    <div class="voucher-title">YOUR PROMO CODE</div>
                    <div class="voucher-code">${couponRewarded.code}</div>
                    <div class="voucher-discount">${couponRewarded.discount || ""} Discount Value</div>
                    <div style="margin-top: 20px; text-align: center;">
                      <img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(couponRewarded.code)}" alt="Scan QR Code to Redeem" style="width: 180px; height: 180px; border-radius: 16px; border: 4px solid #ffffff; display: inline-block; box-shadow: 0 10px 25px rgba(0,0,0,0.5);" />
                      <div style="font-size: 11px; color: #22d3ee; margin-top: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Show or Scan QR at Counter</div>
                    </div>
                  </div>

                  <div class="instructions">
                    <div class="instruction-header">How to Redeem:</div>
                    1. Save this email or present this message on your device.<br>
                    2. Show the code to our counter representative at the time of purchase.<br>
                    3. Enjoy your exclusive discount!
                  </div>
                </div>
                <div class="footer">
                  <p>Sent via AquaFlow Hydration Corp QR Platform</p>
                  <p>&copy; ${new Date().getFullYear()} ${campaign.advertiser.companyName}. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `;
        
        const whatsAppBody = `Hi ${lead.name}! Your unique coupon for ${campaign.advertiser.companyName} is ${couponRewarded.code}. Show this message or the QR at the counter to redeem.`;

        // Send asynchronously to avoid blocking the client request response
        sendEmailNotification(lead.email || "", emailSubject, emailBody, emailHtml, campaign.advertiserId, campaign.advertiser.companyName).catch(console.error);
        sendWhatsAppNotification(
          lead.phone,
          whatsAppBody,
          "COUPON",
          [lead.name, campaign.advertiser.companyName, couponRewarded.code],
          campaign.advertiserId,
          campaign.bannerUrl || "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&h=350&q=80"
        ).catch(console.error);
      } else {
        // Send Enquiry Registration Confirmation
        const emailSubject = `Registration Confirmed - ${campaign.name}`;
        const emailBody = `Hi ${lead.name},\n\nThank you for registering with ${campaign.advertiser.companyName}.\n\nYour details have been successfully captured and registered.\n\nWe will notify you via Email or WhatsApp as soon as future offers or updates are available!\n\nBest regards,\n${campaign.advertiser.companyName}`;

        const emailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Registration Confirmed</title>
              <style>
                body { margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6; }
                .email-container { max-width: 600px; margin: 40px auto; background-color: #111827; border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4); }
                .header { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 32px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
                .brand-title { font-size: 24px; font-weight: 800; color: #c084fc; margin: 0; letter-spacing: -0.5px; }
                .brand-subtitle { font-size: 12px; color: #4b5563; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
                .content { padding: 40px 32px; text-align: center; }
                .greeting { font-size: 18px; font-weight: 600; color: #ffffff; margin-bottom: 16px; text-align: left; }
                .intro { font-size: 14px; color: #9ca3af; line-height: 1.6; margin-bottom: 32px; text-align: left; }
                .info-card { background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.04); border-radius: 16px; padding: 20px; text-align: left; margin: 24px 0; }
                .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
                .info-row:last-child { margin-bottom: 0; }
                .info-label { color: #6b7280; font-weight: 500; }
                .info-value { color: #ffffff; font-weight: 600; }
                .instructions { font-size: 13px; color: #9ca3af; line-height: 1.5; margin-top: 24px; text-align: left; background: rgba(255, 255, 255, 0.02); padding: 16px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.04); }
                .instruction-header { font-weight: 700; color: #ffffff; margin-bottom: 8px; }
                .footer { background-color: #0b0f19; padding: 24px; text-align: center; font-size: 12px; color: #4b5563; border-top: 1px solid rgba(255, 255, 255, 0.05); }
                .footer p { margin: 4px 0; }
              </style>
            </head>
            <body>
              <div class="email-container">
                <div class="header">
                  <div class="brand-title">${campaign.advertiser.companyName}</div>
                  <div class="brand-subtitle">Registration Success</div>
                </div>
                <div class="content">
                  <div class="greeting">Hello ${lead.name},</div>
                  <div class="intro">Thank you for registering with us during the <strong>${campaign.name}</strong> campaign. Your scan details have been successfully verified and securely stored:</div>
                  
                  <div class="info-card">
                    <div class="info-row"><span class="info-label">Name:</span> <span class="info-value">${lead.name}</span></div>
                    <div class="info-row"><span class="info-label">Phone:</span> <span class="info-value">${lead.phone}</span></div>
                    <div class="info-row"><span class="info-label">Campaign:</span> <span class="info-value">${campaign.name}</span></div>
                    <div class="info-row"><span class="info-label">Date:</span> <span class="info-value">${new Date().toLocaleDateString()}</span></div>
                  </div>

                  <div class="instructions">
                    <div class="instruction-header">Next Steps:</div>
                    We will notify you via Email or WhatsApp as soon as future offers, discount codes, or promotional updates are launched for this advertiser.
                  </div>
                </div>
                <div class="footer">
                  <p>Sent via AquaFlow Hydration Corp QR Platform</p>
                  <p>&copy; ${new Date().getFullYear()} ${campaign.advertiser.companyName}. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `;

        const whatsAppBody = `Hi ${lead.name}! Thank you for registering with ${campaign.advertiser.companyName}. We have successfully captured your details and will keep you updated.`;

        sendEmailNotification(lead.email || "", emailSubject, emailBody, emailHtml, campaign.advertiserId, campaign.advertiser.companyName).catch(console.error);
        sendWhatsAppNotification(
          lead.phone,
          whatsAppBody,
          "REGISTRATION",
          [lead.name, campaign.advertiser.companyName],
          campaign.advertiserId,
          campaign.bannerUrl || "https://images.unsplash.com/photo-1548839134-24a5c474350d?auto=format&fit=crop&w=600&h=350&q=80"
        ).catch(console.error);
      }

      // 4. Send Notifications to Advertiser Users
      const advertiserUsers = await tx.user.findMany({
        where: {
          advertiserId: campaign.advertiserId,
          isDeleted: false,
        },
      });

      for (const u of advertiserUsers) {
        await tx.notification.create({
          data: {
            userId: u.id,
            title: "New Lead Captured!",
            message: `${lead.name} submitted lead form under campaign: "${campaign.name}".`,
          },
        });
      }

      // Also notify Super Admins
      const adminUsers = await tx.user.findMany({
        where: {
          role: { name: "SUPER_ADMIN" },
          isDeleted: false,
        },
      });

      for (const admin of adminUsers) {
        await tx.notification.create({
          data: {
            userId: admin.id,
            title: `New Lead - ${campaign.advertiser.name}`,
            message: `${lead.name} registered under campaign: "${campaign.name}".`,
          },
        });
      }

      return {
        lead,
        couponCode: couponRewarded?.code || null,
        discount: couponRewarded?.discount || null,
      };
    });
  }

  static async delete(id: string, user: JWTPayload) {
    // Only Admin or the owner Advertiser can delete a lead
    const lead = await db.lead.findFirst({
      where: { id, isDeleted: false },
    });

    if (!lead) {
      throw new Error("Lead not found");
    }

    if (user.role === "ADVERTISER" && lead.advertiserId !== user.advertiserId) {
      throw new Error("Forbidden: Access denied");
    }

    return db.lead.update({
      where: { id },
      data: { isDeleted: true },
    });
  }
}
