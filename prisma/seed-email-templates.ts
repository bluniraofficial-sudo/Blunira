import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const emailTemplates = [
  {
    name: 'order_confirmation',
    subject: 'Order Confirmation - {{orderNumber}} | Blunira',
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f7f9; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #06b6d4 0%, #2563eb 100%); color: #ffffff; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 800; }
    .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.95; }
    .content { padding: 40px 30px; }
    .order-number { background: #f0f9ff; border-left: 4px solid #06b6d4; padding: 16px 20px; margin: 0 0 24px; border-radius: 8px; }
    .order-number strong { color: #0891b2; font-size: 18px; }
    .info-row { margin: 12px 0; }
    .info-row strong { color: #0f172a; display: inline-block; min-width: 140px; }
    .items-list { background: #f8fafc; border-radius: 8px; padding: 20px; margin: 24px 0; }
    .items-list h3 { margin: 0 0 16px; color: #0f172a; font-size: 16px; }
    .items-list ul { list-style: none; padding: 0; margin: 0; }
    .items-list li { padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
    .items-list li:last-child { border-bottom: none; }
    .total-section { background: #ecfeff; border-radius: 8px; padding: 20px; margin: 24px 0; }
    .total-row { display: flex; justify-content: space-between; margin: 8px 0; }
    .total-row.grand { font-size: 20px; font-weight: 800; color: #0891b2; padding-top: 12px; border-top: 2px solid #06b6d4; margin-top: 12px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #2563eb 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; margin: 24px 0; text-align: center; }
    .footer { background: #f8fafc; padding: 24px 30px; text-align: center; color: #64748b; font-size: 13px; }
    .footer a { color: #06b6d4; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Order Confirmed!</h1>
      <p>Thank you for your order</p>
    </div>
    <div class="content">
      <div class="order-number">
        <strong>Order Number: {{orderNumber}}</strong>
      </div>
      
      <p>Dear <strong>{{companyName}}</strong>,</p>
      <p>Your order has been successfully placed and is being processed. Here are the details:</p>
      
      <div class="items-list">
        <h3>📦 Order Items</h3>
        <ul>
          {{items}}
        </ul>
      </div>
      
      <div class="total-section">
        <div class="total-row">
          <span>Total Amount:</span>
          <strong>{{totalAmount}}</strong>
        </div>
        <div class="total-row grand">
          <span>Advance Payment (50%):</span>
          <strong>{{advanceAmount}}</strong>
        </div>
      </div>
      
      <p><strong>Next Steps:</strong></p>
      <ol>
        <li>Pay the advance amount (50%) to confirm your order</li>
        <li>Upload payment proof in your dashboard</li>
        <li>Our team will verify and process your order</li>
        <li>Invoice will be sent once payment is verified</li>
      </ol>
      
      <div style="text-align: center;">
        <a href="https://blunira.com/advertiser/orders" class="btn">View Order Details</a>
      </div>
    </div>
    <div class="footer">
      <p>© 2026 Blunira. All rights reserved.</p>
      <p><a href="https://blunira.com">blunira.com</a> | <a href="mailto:hello@blunira.com">hello@blunira.com</a></p>
    </div>
  </div>
</body>
</html>
    `,
    textBody: `
Order Confirmation - {{orderNumber}}

Dear {{companyName}},

Your order has been successfully placed!

Order Number: {{orderNumber}}
Total Amount: {{totalAmount}}
Advance Payment (50%): {{advanceAmount}}

Order Items:
{{items}}

Next Steps:
1. Pay the advance amount (50%) to confirm your order
2. Upload payment proof in your dashboard
3. Our team will verify and process your order

View your order: https://blunira.com/advertiser/orders

Thank you for choosing Blunira!
    `,
    variables: JSON.stringify(['orderNumber', 'companyName', 'totalAmount', 'advanceAmount', 'items']),
  },
  {
    name: 'payment_reminder',
    subject: 'Payment Reminder - {{orderNumber}} | Blunira',
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background-color: #f4f7f9; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%); color: #ffffff; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 800; }
    .content { padding: 40px 30px; }
    .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 24px 0; border-radius: 8px; }
    .balance-amount { font-size: 32px; color: #dc2626; font-weight: 800; text-align: center; margin: 24px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #2563eb 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; margin: 24px 0; text-align: center; }
    .footer { background: #f8fafc; padding: 24px 30px; text-align: center; color: #64748b; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Payment Reminder</h1>
      <p>Your order is awaiting payment</p>
    </div>
    <div class="content">
      <p>Dear <strong>{{companyName}}</strong>,</p>
      <p>This is a friendly reminder that your order <strong>{{orderNumber}}</strong> has a pending balance payment.</p>
      
      <div class="alert-box">
        <strong>⚠️ Payment Due</strong><br>
        Please complete the payment to avoid order cancellation.
      </div>
      
      <div class="balance-amount">
        Balance: {{balanceAmount}}
      </div>
      
      <p><strong>Payment Due Date:</strong> {{dueDate}}</p>
      
      <div style="text-align: center;">
        <a href="https://blunira.com/advertiser/orders" class="btn">Make Payment Now</a>
      </div>
      
      <p style="margin-top: 32px; font-size: 13px; color: #64748b;">
        If you have already made the payment, please upload the proof in your dashboard or ignore this reminder.
      </p>
    </div>
    <div class="footer">
      <p>© 2026 Blunira. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
    textBody: `Payment Reminder - {{orderNumber}}

Dear {{companyName}},

This is a reminder that your order {{orderNumber}} has a pending balance payment.

Balance Amount: {{balanceAmount}}
Payment Due: {{dueDate}}

Please make the payment to avoid order cancellation.

Make payment: https://blunira.com/advertiser/orders

Thank you!`,
    variables: JSON.stringify(['orderNumber', 'companyName', 'balanceAmount', 'dueDate']),
  },
  {
    name: 'invoice_sent',
    subject: 'Invoice {{invoiceNumber}} - Order {{orderNumber}} | Blunira',
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background-color: #f4f7f9; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 800; }
    .content { padding: 40px 30px; }
    .invoice-box { background: #f0fdf4; border: 2px solid #10b981; padding: 20px; margin: 24px 0; border-radius: 8px; text-align: center; }
    .invoice-box strong { color: #059669; font-size: 20px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; margin: 24px 0; }
    .footer { background: #f8fafc; padding: 24px 30px; text-align: center; color: #64748b; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📄 Invoice Available</h1>
      <p>Your invoice is ready</p>
    </div>
    <div class="content">
      <p>Dear <strong>{{companyName}}</strong>,</p>
      <p>Your invoice for order <strong>{{orderNumber}}</strong> has been generated and is ready for download.</p>
      
      <div class="invoice-box">
        <p>Invoice Number</p>
        <strong>{{invoiceNumber}}</strong>
      </div>
      
      <div style="text-align: center;">
        <a href="{{invoiceUrl}}" class="btn">Download Invoice</a>
      </div>
      
      <p style="margin-top: 32px;">
        <strong>Note:</strong> Please keep this invoice for your records. If you have any questions, feel free to contact our support team.
      </p>
    </div>
    <div class="footer">
      <p>© 2026 Blunira. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
    textBody: `Invoice Available - {{invoiceNumber}}

Dear {{companyName}},

Your invoice for order {{orderNumber}} is ready.

Invoice Number: {{invoiceNumber}}

Download: {{invoiceUrl}}

Thank you!`,
    variables: JSON.stringify(['orderNumber', 'companyName', 'invoiceNumber', 'invoiceUrl']),
  },
  {
    name: 'order_status_update',
    subject: 'Order Status Update - {{orderNumber}} | Blunira',
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background-color: #f4f7f9; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #06b6d4 0%, #2563eb 100%); color: #ffffff; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 800; }
    .content { padding: 40px 30px; }
    .status-box { background: #f0f9ff; border-left: 4px solid #06b6d4; padding: 20px; margin: 24px 0; border-radius: 8px; }
    .status-box .status { font-size: 24px; color: #0891b2; font-weight: 800; }
    .btn { display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #2563eb 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; margin: 24px 0; }
    .footer { background: #f8fafc; padding: 24px 30px; text-align: center; color: #64748b; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📦 Order Update</h1>
      <p>Your order status has changed</p>
    </div>
    <div class="content">
      <p>Dear <strong>{{companyName}}</strong>,</p>
      <p>Your order <strong>{{orderNumber}}</strong> has been updated.</p>
      
      <div class="status-box">
        <p style="margin: 0 0 8px; font-size: 14px; color: #64748b;">Current Status</p>
        <div class="status">{{status}}</div>
        <p style="margin: 12px 0 0; font-size: 14px;">{{statusMessage}}</p>
      </div>
      
      <div style="text-align: center;">
        <a href="https://blunira.com/advertiser/orders" class="btn">View Order Details</a>
      </div>
    </div>
    <div class="footer">
      <p>© 2026 Blunira. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
    textBody: `Order Status Update - {{orderNumber}}

Dear {{companyName}},

Your order {{orderNumber}} status has been updated to: {{status}}

{{statusMessage}}

View order: https://blunira.com/advertiser/orders

Thank you!`,
    variables: JSON.stringify(['orderNumber', 'companyName', 'status', 'statusMessage']),
  },
];

async function seedEmailTemplates() {
  console.log('Seeding email templates...');

  for (const template of emailTemplates) {
    await prisma.emailTemplate.upsert({
      where: { name: template.name },
      update: template,
      create: template,
    });
    console.log(`✓ Created/Updated template: ${template.name}`);
  }

  console.log('Email templates seeded successfully!');
}

seedEmailTemplates()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
