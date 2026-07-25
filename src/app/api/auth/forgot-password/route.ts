import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";
import { sendEmailNotification } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await db.user.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        isDeleted: false,
      },
    });

    if (!user) {
      // Return success anyway for security reasons to prevent user enumeration
      return NextResponse.json({
        success: true,
        message: "If the email is registered, password reset instructions have been sent.",
      });
    }

    // Generate secure token
    const token = crypto.randomUUID();
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry,
      },
    });

    // Log the request to system audit logs
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "PASSWORD_RESET_REQUEST",
        details: `Password reset requested. Token: ${token}`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    const resetUrl = `${request.nextUrl.origin}/auth/reset-password?token=${token}`;

    // Send email using system SMTP credentials (fromName override set to "Blunira")
    const subject = "Reset Your Password - Blunira";
    const text = `Hello ${user.name},\n\nYou requested a password reset for your Blunira account. Please use the following link to choose a new password:\n\n${resetUrl}\n\nThis link will expire in 1 hour. If you did not request this, you can safely ignore this email.`;
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 550px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #6366f1; margin: 0; font-size: 28px; font-weight: 800; tracking-tight">Blunira</h1>
          <p style="color: #64748b; font-size: 13px; margin-top: 4px; margin-bottom: 0;">Secure Password Recovery</p>
        </div>
        
        <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 20px;">
          <p style="font-size: 15px; line-height: 24px; color: #334155; margin-top: 0;">Hello <strong>${user.name}</strong>,</p>
          <p style="font-size: 14px; line-height: 24px; color: #475569; margin-bottom: 24px;">We received a request to reset the password associated with this email address. Please click the button below to choose a secure new password:</p>
          
          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);">Reset Password</a>
          </div>
          
          <p style="font-size: 13px; color: #64748b; line-height: 20px; margin-top: 24px;">If the button doesn't work, copy and paste this URL into your browser:</p>
          <p style="word-break: break-all; font-size: 12px; margin: 8px 0; background-color: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #f1f5f9;"><a href="${resetUrl}" style="color: #4f46e5; text-decoration: none; font-family: monospace;">${resetUrl}</a></p>
        </div>
        
        <div>
          <p style="color: #ef4444; font-size: 12px; font-weight: 500; line-height: 18px; margin: 0 0 8px 0;">⏰ This link is valid for 1 hour only.</p>
          <p style="color: #94a3b8; font-size: 11px; line-height: 16px; margin: 0;">If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
        </div>
      </div>
    `;

    // Send the email (do not pass advertiserId, ensuring it uses the default system SMTP config: blunira.official@gmail.com)
    await sendEmailNotification(user.email, subject, text, html, undefined, "Blunira");

    // For convenience in local development, we return the token in the payload
    const isDev = process.env.NODE_ENV === "development";

    return NextResponse.json({
      success: true,
      message: "If the email is registered, password reset instructions have been sent.",
      token: isDev ? token : undefined,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
