import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed database...");

  // Clean the database
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.couponRedemption.deleteMany({});
  await prisma.lead.deleteMany({});
  await prisma.qrScan.deleteMany({});
  await prisma.qrCode.deleteMany({});
  await prisma.landingPage.deleteMany({});
  await prisma.campaign.deleteMany({});
  await prisma.coupon.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.advertiser.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.settings.deleteMany({});

  console.log("Database cleaned.");

  // Create Roles
  const adminRole = await prisma.role.create({
    data: { name: "SUPER_ADMIN" },
  });

  const advertiserRole = await prisma.role.create({
    data: { name: "ADVERTISER" },
  });

  console.log("Roles created:", adminRole.name, advertiserRole.name);

  // Hash passwords
  const passwordHashAdmin = await bcrypt.hash("admin123", 10);
  const passwordHashAdvertiser = await bcrypt.hash("advertiser123", 10);

  // Create Super Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@qrplatform.com",
      name: "Alex SuperAdmin",
      passwordHash: passwordHashAdmin,
      roleId: adminRole.id,
    },
  });

  console.log("Admin user created:", adminUser.email);

  // Create Advertiser Tenant
  const advertiserTenant = await prisma.advertiser.create({
    data: {
      name: "AquaFlow Bottles",
      companyName: "AquaFlow Hydration Pvt Ltd",
      email: "billing@aquaflow.com",
      phone: "+91 98765 43210",
      category: "Beverages",
      status: "ACTIVE",
    },
  });

  console.log("Advertiser tenant created:", advertiserTenant.name);

  // Create Advertiser User linked to the Tenant
  const advertiserUser = await prisma.user.create({
    data: {
      email: "advertiser@qrplatform.com",
      name: "John AquaFlow",
      passwordHash: passwordHashAdvertiser,
      roleId: advertiserRole.id,
      advertiserId: advertiserTenant.id,
    },
  });

  console.log("Advertiser user created:", advertiserUser.email);

  // Create Coupon
  const coupon = await prisma.coupon.create({
    data: {
      code: "AQUA20",
      title: "20% Off Next AquaFlow Bottle",
      description: "Get 20% off any premium water bottle from AquaFlow.",
      discount: "20%",
      maxRedemptions: 100,
      currentRedemptions: 4,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      advertiserId: advertiserTenant.id,
    },
  });

  // Create Campaign
  const campaign = await prisma.campaign.create({
    data: {
      name: "Summer Hydration Blitz 2026",
      description: "Promoting physical wellness and bottle scanning reward program.",
      status: "ACTIVE",
      advertiserId: advertiserTenant.id,
      bannerUrl: "/uploads/placeholder_banner.jpg",
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Started 7 days ago
      endDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000), // Ends in 23 days
    },
  });

  console.log("Campaign created:", campaign.name);

  // Link Coupon to Campaign
  await prisma.coupon.update({
    where: { id: coupon.id },
    data: { campaignId: campaign.id },
  });

  // Create Landing Page for Campaign
  const landingPage = await prisma.landingPage.create({
    data: {
      campaignId: campaign.id,
      title: "Stay Refreshed & Win Rewards!",
      subtitle: "Scan your AquaFlow bottle, fill in your details, and claim an instant 20% off coupon code.",
      imageBanner: "/uploads/placeholder_banner.jpg",
      offerText: "Instant 20% discount on AquaFlow Eco-Series bottles",
      countdownEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days left
      leadFormEnabled: true,
      whatsappButton: true,
      whatsappNumber: "+15550192834",
      callButton: true,
      callNumber: "+15550192834",
      websiteButton: true,
      websiteUrl: "https://aquaflow.example.com",
      googleMapsUrl: "https://maps.google.com/?q=AquaFlow+Hydration",
      termsText: "Promotion active while stocks last. One entry per bottle QR code.",
      privacyText: "Your details will only be used to send your coupon code and updates from AquaFlow.",
    },
  });

  console.log("Landing page created for campaign:", landingPage.title);

  // Generate 10 sequential QR Codes
  const qrCodes = [];
  for (let i = 1; i <= 10; i++) {
    const codeNum = String(i).padStart(9, "0"); // QR000000001
    const qrCodeId = `QR${codeNum}`;
    const qr = await prisma.qrCode.create({
      data: {
        qrCodeId,
        publicUrl: `/q/${qrCodeId}`,
        campaignId: campaign.id,
        bottleBatch: "Batch-SUMMER-01",
        status: "ACTIVE",
        scanCount: 0,
      },
    });
    qrCodes.push(qr);
  }
  console.log("10 QR codes generated, from QR000000001 to QR000000010");

  // Seed Bottle Products
  console.log("\nSeeding bottle products...");
  
  const bottleProducts = [
    {
      name: 'Blunira Premium 250ml',
      description: 'Compact premium spring water in 250ml bottles with QR-enabled labels. Perfect for events and retail packs.',
      capacity: '250ml',
      moq: 100,
      bottlesPerPack: 12,
      pricePerUnit: 8.50,
      pricePerPack: 102.00,
      imageUrl: '/products/bottle-250ml.png',
      status: 'ACTIVE',
    },
    {
      name: 'Blunira Premium 500ml',
      description: 'Premium spring water in 500ml bottles with QR-enabled labels. Our most popular retail size.',
      capacity: '500ml',
      moq: 50,
      bottlesPerPack: 12,
      pricePerUnit: 12.50,
      pricePerPack: 150.00,
      imageUrl: '/products/bottle-500ml.png',
      status: 'ACTIVE',
    },
    {
      name: 'Blunira Premium 1L',
      description: 'Premium spring water in 1 liter bottles with QR-enabled labels. Ideal for family packs and gifting.',
      capacity: '1L',
      moq: 30,
      bottlesPerPack: 6,
      pricePerUnit: 22.00,
      pricePerPack: 132.00,
      imageUrl: '/products/bottle-1l.png',
      status: 'ACTIVE',
    },
    {
      name: 'Blunira Premium 2L',
      description: 'Premium spring water in 2 liter bottles with QR-enabled labels. Great value for households.',
      capacity: '2L',
      moq: 20,
      bottlesPerPack: 4,
      pricePerUnit: 38.00,
      pricePerPack: 152.00,
      imageUrl: '/products/bottle-2l.png',
      status: 'ACTIVE',
    },
    {
      name: 'Blunira Premium 5L',
      description: 'Premium spring water in 5 liter bottles with QR-enabled labels. Perfect for offices and events.',
      capacity: '5L',
      moq: 10,
      bottlesPerPack: 2,
      pricePerUnit: 85.00,
      pricePerPack: 170.00,
      imageUrl: '/products/bottle-5l.png',
      status: 'ACTIVE',
    },
    {
      name: 'Blunira Eco Glass 750ml',
      description: 'Eco-friendly glass bottle with premium spring water. Sustainable packaging with QR labels.',
      capacity: '750ml',
      moq: 20,
      bottlesPerPack: 8,
      pricePerUnit: 45.00,
      pricePerPack: 360.00,
      imageUrl: '/products/bottle-glass-750ml.png',
      status: 'ACTIVE',
    },
    {
      name: 'Blunira Sports Flip-Top 600ml',
      description: 'Sports-friendly flip-top bottle with premium water. Ideal for gyms and sports events.',
      capacity: '600ml',
      moq: 30,
      bottlesPerPack: 12,
      pricePerUnit: 35.00,
      pricePerPack: 420.00,
      imageUrl: '/products/bottle-sports-600ml.png',
      status: 'ACTIVE',
    },
    {
      name: 'Blunira Sparkling 330ml',
      description: 'Premium sparkling water in sleek 330ml cans with QR-enabled labels. Perfect for premium retail.',
      capacity: '330ml',
      moq: 50,
      bottlesPerPack: 24,
      pricePerUnit: 18.00,
      pricePerPack: 432.00,
      imageUrl: '/products/can-sparkling-330ml.png',
      status: 'INACTIVE',
    },
  ];

  for (const product of bottleProducts) {
    await prisma.bottleProduct.create({
      data: product,
    });
  }
  console.log(`✓ Seeded ${bottleProducts.length} bottle products`);

  // Seed Dummy Orders
  console.log("\nSeeding dummy orders...");

  const products = await prisma.bottleProduct.findMany();
  const productMap = new Map(products.map(p => [p.name, p.id]));

  const ordersData = [
    {
      orderNumber: "ORD-2026-0001",
      status: "DELIVERED",
      totalAmount: 11460.00,
      advanceAmount: 5730.00,
      balanceAmount: 5730.00,
      advancePaid: true,
      advancePaidAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      fullPaid: true,
      fullPaidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      paymentMethod: "BANK_TRANSFER",
      shippingAddress: "123 MG Road",
      shippingCity: "Mumbai",
      shippingState: "Maharashtra",
      shippingPincode: "400001",
      gstNumber: "27AABCN1234R1ZX",
      notes: "Deliver before 5 PM",
      items: [
        { productId: productMap.get("Blunira Premium 500ml") || "", quantity: 600, pricePerUnit: 12.50, totalPrice: 7500.00 },
        { productId: productMap.get("Blunira Premium 1L") || "", quantity: 180, pricePerUnit: 22.00, totalPrice: 3960.00 },
      ],
      payments: [
        { paymentType: "ADVANCE", paymentMethod: "BANK_TRANSFER", amount: 5730.00, status: "VERIFIED", transactionId: "TXN001", notes: "Advance received" },
        { paymentType: "BALANCE", paymentMethod: "BANK_TRANSFER", amount: 5730.00, status: "VERIFIED", transactionId: "TXN002", notes: "Balance cleared" },
      ],
    },
    {
      orderNumber: "ORD-2026-0002",
      status: "PROCESSING",
      totalAmount: 20100.00,
      advanceAmount: 10050.00,
      balanceAmount: 10050.00,
      advancePaid: true,
      advancePaidAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      fullPaid: false,
      paymentMethod: "UPI",
      shippingAddress: "45 Churchgate",
      shippingCity: "Mumbai",
      shippingState: "Maharashtra",
      shippingPincode: "400020",
      gstNumber: "",
      notes: "Rush delivery",
      items: [
        { productId: productMap.get("Blunira Sports Flip-Top 600ml") || "", quantity: 360, pricePerUnit: 35.00, totalPrice: 12600.00 },
        { productId: productMap.get("Blunira Premium 500ml") || "", quantity: 600, pricePerUnit: 12.50, totalPrice: 7500.00 },
      ],
      payments: [
        { paymentType: "ADVANCE", paymentMethod: "UPI", amount: 10050.00, status: "VERIFIED", transactionId: "TXN003", notes: "Advance via UPI" },
      ],
    },
    {
      orderNumber: "ORD-2026-0003",
      status: "PENDING",
      totalAmount: 17400.00,
      advanceAmount: 8700.00,
      balanceAmount: 8700.00,
      advancePaid: false,
      paymentMethod: null,
      shippingAddress: "78 Residency Road",
      shippingCity: "Bengaluru",
      shippingState: "Karnataka",
      shippingPincode: "560001",
      gstNumber: "29AABCN1234R1ZX",
      notes: "Awaiting advance payment",
      items: [
        { productId: productMap.get("Blunira Eco Glass 750ml") || "", quantity: 160, pricePerUnit: 45.00, totalPrice: 7200.00 },
        { productId: productMap.get("Blunira Premium 250ml") || "", quantity: 1200, pricePerUnit: 8.50, totalPrice: 10200.00 },
      ],
      payments: [],
    },
    {
      orderNumber: "ORD-2026-0004",
      status: "SHIPPED",
      totalAmount: 4740.00,
      advanceAmount: 2370.00,
      balanceAmount: 2370.00,
      advancePaid: true,
      advancePaidAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      fullPaid: false,
      paymentMethod: "CARD",
      shippingAddress: "22 Anna Salai",
      shippingCity: "Chennai",
      shippingState: "Tamil Nadu",
      shippingPincode: "600002",
      gstNumber: "33AABCN1234R1ZX",
      notes: "Ship in waterproof packing",
      items: [
        { productId: productMap.get("Blunira Premium 5L") || "", quantity: 20, pricePerUnit: 85.00, totalPrice: 1700.00 },
        { productId: productMap.get("Blunira Premium 2L") || "", quantity: 80, pricePerUnit: 38.00, totalPrice: 3040.00 },
      ],
      payments: [
        { paymentType: "ADVANCE", paymentMethod: "CARD", amount: 2370.00, status: "VERIFIED", transactionId: "TXN004", notes: "Advance via card" },
      ],
    },
    {
      orderNumber: "ORD-2026-0005",
      status: "CONFIRMED",
      totalAmount: 21600.00,
      advanceAmount: 10800.00,
      balanceAmount: 10800.00,
      advancePaid: true,
      advancePaidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      fullPaid: false,
      paymentMethod: "UPI",
      shippingAddress: "90 Park Street",
      shippingCity: "Kolkata",
      shippingState: "West Bengal",
      shippingPincode: "700016",
      gstNumber: "",
      notes: "",
      items: [
        { productId: productMap.get("Blunira Sparkling 330ml") || "", quantity: 1200, pricePerUnit: 18.00, totalPrice: 21600.00 },
      ],
      payments: [
        { paymentType: "ADVANCE", paymentMethod: "UPI", amount: 10800.00, status: "VERIFIED", transactionId: "TXN005", notes: "Advance via UPI" },
      ],
    },
  ];

  for (const orderData of ordersData) {
    const { items, payments, ...orderFields } = orderData;
    const order = await prisma.order.create({
      data: {
        ...orderFields,
        advertiserId: advertiserTenant.id,
        items: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            pricePerUnit: item.pricePerUnit,
            totalPrice: item.totalPrice,
          })),
        },
      },
      include: { items: true },
    });

    for (const payment of payments) {
      await prisma.payment.create({
        data: {
          ...payment,
          orderId: order.id,
        },
      });
    }

    console.log(`✓ Seeded order ${order.orderNumber}`);
  }

  console.log(`✓ Seeded ${ordersData.length} dummy orders`);

  // Seed Email Templates
  console.log("\nSeeding email templates...");
  
  const emailTemplates = [
    {
      name: 'order_confirmation',
      subject: 'Order Confirmation - {{orderNumber}} | Blunira',
      htmlBody: `<!DOCTYPE html>...`, // Simplified for brevity
      textBody: `Order Confirmation - {{orderNumber}}`,
      variables: '["orderNumber","companyName","totalAmount","advanceAmount","items"]',
      isActive: true,
    },
    {
      name: 'payment_reminder',
      subject: 'Payment Reminder - {{orderNumber}} | Blunira',
      htmlBody: `<!DOCTYPE html>...`,
      textBody: `Payment Reminder - {{orderNumber}}`,
      variables: '["orderNumber","companyName","balanceAmount","dueDate"]',
      isActive: true,
    },
    {
      name: 'invoice_sent',
      subject: 'Invoice {{invoiceNumber}} - Order {{orderNumber}} | Blunira',
      htmlBody: `<!DOCTYPE html>...`,
      textBody: `Invoice Available - {{invoiceNumber}}`,
      variables: '["orderNumber","companyName","invoiceNumber","invoiceUrl"]',
      isActive: true,
    },
    {
      name: 'order_status_update',
      subject: 'Order Status Update - {{orderNumber}} | Blunira',
      htmlBody: `<!DOCTYPE html>...`,
      textBody: `Order Status Update - {{orderNumber}}`,
      variables: '["orderNumber","companyName","status","statusMessage"]',
      isActive: true,
    },
  ];

  for (const template of emailTemplates) {
    await prisma.emailTemplate.upsert({
      where: { name: template.name },
      update: template,
      create: template,
    });
  }
  console.log(`✓ Seeded ${emailTemplates.length} email templates`);

  // Create System Settings
  await prisma.settings.createMany({
    data: [
      { key: "site_name", value: "QR Advertising Platform", description: "The public name of the platform." },
      { key: "allow_registration", value: "false", description: "Whether new users can register on their own." },
      { key: "rate_limit_scans", value: "60", description: "Max scans allowed per IP per minute." },
      { key: "support_email", value: "support@blunira.com", description: "Support email address." },
      { key: "whatsapp_number", value: "+91 98765 43210", description: "WhatsApp support number." },
    ],
  });

  console.log("\n✅ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
