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
      companyName: "AquaFlow Hydration Corp",
      email: "billing@aquaflow.com",
      phone: "+1 (555) 019-2834",
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

  // Create System Settings
  await prisma.settings.createMany({
    data: [
      { key: "site_name", value: "QR Advertising Platform", description: "The public name of the platform." },
      { key: "allow_registration", value: "false", description: "Whether new users can register on their own." },
      { key: "rate_limit_scans", value: "60", description: "Max scans allowed per IP per minute." },
    ],
  });

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
