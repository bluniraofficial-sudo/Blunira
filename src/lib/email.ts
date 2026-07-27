import nodemailer from 'nodemailer';
import { db } from './db';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify transporter configuration
export async function verifyEmailConfig() {
  try {
    await transporter.verify();
    return { success: true, message: 'Email configuration verified' };
  } catch (error: any) {
    console.error('Email verification failed:', error);
    return { success: false, message: error.message };
  }
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: any[];
}

// Send email function
export async function sendEmail(options: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Blunira'}" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
    });

    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
}

// Replace template variables
function replaceVariables(template: string, variables: Record<string, any>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, String(value || ''));
  }
  return result;
}

// Send templated email
export async function sendTemplatedEmail(
  templateName: string,
  to: string,
  variables: Record<string, any>
) {
  try {
    // Get template from database
    const template = await db.emailTemplate.findUnique({
      where: { name: templateName, isActive: true },
    });

    if (!template) {
      throw new Error(`Email template "${templateName}" not found or inactive`);
    }

    // Replace variables in subject and body
    const subject = replaceVariables(template.subject, variables);
    const html = replaceVariables(template.htmlBody, variables);
    const text = template.textBody ? replaceVariables(template.textBody, variables) : undefined;

    // Send email
    return await sendEmail({ to, subject, html, text });
  } catch (error: any) {
    console.error('Templated email failed:', error);
    return { success: false, error: error.message };
  }
}

// Specific email sending functions
export async function sendOrderConfirmationEmail(
  email: string,
  orderData: {
    orderNumber: string;
    companyName: string;
    totalAmount: number;
    advanceAmount: number;
    items: Array<{ name: string; quantity: number; price: number }>;
  }
) {
  const itemsHtml = orderData.items
    .map(
      (item) =>
        `<li>${item.name} - Quantity: ${item.quantity} - ₹${item.price.toFixed(2)}</li>`
    )
    .join('');

  return await sendTemplatedEmail('order_confirmation', email, {
    orderNumber: orderData.orderNumber,
    companyName: orderData.companyName,
    totalAmount: `₹${orderData.totalAmount.toFixed(2)}`,
    advanceAmount: `₹${orderData.advanceAmount.toFixed(2)}`,
    items: itemsHtml,
  });
}

export async function sendPaymentReminderEmail(
  email: string,
  orderData: {
    orderNumber: string;
    companyName: string;
    balanceAmount: number;
    dueDate?: string;
  }
) {
  return await sendTemplatedEmail('payment_reminder', email, {
    orderNumber: orderData.orderNumber,
    companyName: orderData.companyName,
    balanceAmount: `₹${orderData.balanceAmount.toFixed(2)}`,
    dueDate: orderData.dueDate || 'ASAP',
  });
}

export async function sendInvoiceEmail(
  email: string,
  orderData: {
    orderNumber: string;
    companyName: string;
    invoiceNumber: string;
    invoiceUrl: string;
  }
) {
  return await sendTemplatedEmail('invoice_sent', email, {
    orderNumber: orderData.orderNumber,
    companyName: orderData.companyName,
    invoiceNumber: orderData.invoiceNumber,
    invoiceUrl: orderData.invoiceUrl,
  });
}

export async function sendOrderStatusEmail(
  email: string,
  orderData: {
    orderNumber: string;
    companyName: string;
    status: string;
    statusMessage: string;
  }
) {
  return await sendTemplatedEmail('order_status_update', email, {
    orderNumber: orderData.orderNumber,
    companyName: orderData.companyName,
    status: orderData.status,
    statusMessage: orderData.statusMessage,
  });
}
