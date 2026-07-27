import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sample bottle products
const bottleProducts = [
  {
    name: 'Blunira Premium 250ml',
    description: 'Compact premium spring water in 250ml bottles with QR-enabled labels. Perfect for events and retail packs.',
    capacity: '250ml',
    moq: 2000,
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
    moq: 1000,
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
    moq: 500,
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
    moq: 250,
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
    moq: 100,
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
    moq: 300,
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
    moq: 500,
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
    moq: 1200,
    bottlesPerPack: 24,
    pricePerUnit: 18.00,
    pricePerPack: 432.00,
    imageUrl: '/products/can-sparkling-330ml.png',
    status: 'INACTIVE',
  },
];

async function seedBottleProducts() {
  console.log('Seeding bottle products...');

  // Check if products already exist
  const existingCount = await prisma.bottleProduct.count();
  if (existingCount > 0) {
    console.log(`Products already exist (${existingCount} found). Skipping seed.`);
    console.log('To re-seed, manually delete all products first or use --force flag.\n');
    return;
  }

  for (const product of bottleProducts) {
    const created = await prisma.bottleProduct.create({
      data: product,
    });
    console.log(`✓ Created product: ${created.name} (MOQ: ${created.moq}, Price: ₹${created.pricePerUnit})`);
  }

  console.log('\nBottle products seeded successfully!');
  console.log(`Total products created: ${bottleProducts.length}`);
}

seedBottleProducts()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
