import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { z } from "zod";

const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = contactSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    const enquiry = await db.contactEnquiry.create({
      data: {
        firstName: result.data.firstName,
        lastName: result.data.lastName || null,
        email: result.data.email,
        company: result.data.company || null,
        message: result.data.message,
      },
    });

    try {
      const admin = await db.user.findFirst({
        where: { role: { name: "SUPER_ADMIN" } },
        orderBy: { createdAt: "asc" },
      });
      if (admin?.email) {
        sendEmail({
          to: admin.email,
          subject: `New Contact Enquiry from ${result.data.firstName} ${result.data.lastName || ""}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f8fafc;border-radius:16px;">
              <div style="background:linear-gradient(135deg,#06b6d4,#2563eb);padding:24px;border-radius:12px;margin-bottom:24px;">
                <h1 style="color:white;margin:0;font-size:20px;">New Contact Enquiry 📬</h1>
              </div>
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:8px 0;color:#64748b;font-size:13px;font-weight:600;">Name</td><td style="padding:8px 0;color:#0f172a;font-size:13px;font-weight:700;">${result.data.firstName} ${result.data.lastName || ""}</td></tr>
                <tr><td style="padding:8px 0;color:#64748b;font-size:13px;font-weight:600;border-top:1px solid #e2e8f0;">Email</td><td style="padding:8px 0;color:#0f172a;font-size:13px;font-weight:700;border-top:1px solid #e2e8f0;">${result.data.email}</td></tr>
                ${result.data.company ? `<tr><td style="padding:8px 0;color:#64748b;font-size:13px;font-weight:600;border-top:1px solid #e2e8f0;">Company</td><td style="padding:8px 0;color:#0f172a;font-size:13px;font-weight:700;border-top:1px solid #e2e8f0;">${result.data.company}</td></tr>` : ""}
                <tr><td style="padding:8px 0;color:#64748b;font-size:13px;font-weight:600;border-top:1px solid #e2e8f0;">Message</td><td style="padding:8px 0;color:#0f172a;font-size:13px;font-weight:700;border-top:1px solid #e2e8f0;">${result.data.message}</td></tr>
              </table>
            </div>
          `.trim(),
        });
      }
    } catch (e) {
      console.error("Failed to send notification email for contact enquiry:", e);
    }

    return NextResponse.json({ success: true, message: "Message sent successfully!" });
  } catch (error: any) {
    console.error("Contact API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}