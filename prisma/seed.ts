// prisma/seed.ts
// Run with: npx prisma db seed

import { PrismaClient, FurnitureCategory, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // ============================================
  // CREATE ADMIN USER
  // ============================================
  
  const adminPassword = await bcrypt.hash('112233', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@furniture.com' },
    update: {},
    create: {
      email: 'admin@furniture.com',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      emailVerified: true,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create cart for admin
  await prisma.cart.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id },
  });

  // ============================================
  // CREATE TEST CUSTOMER
  // ============================================
  
  const customerPassword = await bcrypt.hash('112233', 12);
  
  const customer = await prisma.user.upsert({
    where: { email: 'customer@test.com' },
    update: {},
    create: {
      email: 'customer@test.com',
      passwordHash: customerPassword,
      firstName: 'Test',
      lastName: 'Customer',
      phone: '+96170123456',
      role: UserRole.CUSTOMER,
      emailVerified: true,
    },
  });
  console.log('✅ Test customer created:', customer.email);

  // Create cart for customer
  await prisma.cart.upsert({
    where: { userId: customer.id },
    update: {},
    create: { userId: customer.id },
  });

  // Create address for customer
  await prisma.address.upsert({
    where: { id: 'test-address-1' },
    update: {},
    create: {
      id: 'test-address-1',
      userId: customer.id,
      label: 'Home',
      fullName: 'Test Customer',
      phone: '+96170123456',
      addressLine1: 'Clemenceau Street, Building 45',
      addressLine2: 'Floor 3, Apt 12',
      city: 'Beirut',
      region: 'Beirut',
      isDefault: true,
    },
  });

  // ============================================
  // CREATE SAMPLE PRODUCTS
  // ============================================
  
  const products = [
    {
      sku: 'TBL-MIL-001',
      slug: 'milano-dining-table',
      name: 'Milano Dining Table',
      description: 'Elegant 8-seater dining table inspired by Italian design. Features a solid wood top with a sophisticated metal base. Perfect for dinner parties and family gatherings.',
      story: 'Inspired by the timeless elegance of Milanese design houses, this table brings luxury to your dining room at a fraction of the price. Each piece is handcrafted by our skilled artisans in Lebanon.',
      category: FurnitureCategory.TABLES,
      basePrice: 1600,
      width: 220,
      height: 75,
      depth: 100,
      weight: 85,
      leadTimeDays: 28,
      isActive: true,
      isFeatured: true,
      materialOptions: [
        { name: 'Oak', type: 'wood', priceModifier: 0, isDefault: true },
        { name: 'Walnut', type: 'wood', priceModifier: 200 },
        { name: 'Mahogany', type: 'wood', priceModifier: 350 },
      ],
      colorOptions: [
        { name: 'Natural', hexCode: '#D4A574', priceModifier: 0, isDefault: true },
        { name: 'Dark Espresso', hexCode: '#3C2415', priceModifier: 50 },
        { name: 'Warm Honey', hexCode: '#EB9605', priceModifier: 50 },
      ],
    },
    {
      sku: 'SOF-MOD-001',
      slug: 'modern-cloud-sofa',
      name: 'Modern Cloud Sofa',
      description: 'Ultra-comfortable 3-seater sofa with deep cushions and premium fabric. The modular design allows for various configurations.',
      story: 'Sink into luxury with our Cloud Sofa. Designed for maximum comfort without compromising on style, featuring high-density foam cushions wrapped in the softest fabrics.',
      category: FurnitureCategory.SOFAS,
      basePrice: 2200,
      width: 280,
      height: 85,
      depth: 110,
      weight: 120,
      leadTimeDays: 35,
      isActive: true,
      isFeatured: true,
      materialOptions: [
        { name: 'Premium Velvet', type: 'fabric', priceModifier: 0, isDefault: true },
        { name: 'Italian Leather', type: 'leather', priceModifier: 800 },
        { name: 'Boucle', type: 'fabric', priceModifier: 300 },
      ],
      colorOptions: [
        { name: 'Charcoal Grey', hexCode: '#36454F', priceModifier: 0, isDefault: true },
        { name: 'Cream White', hexCode: '#FFFDD0', priceModifier: 0 },
        { name: 'Forest Green', hexCode: '#228B22', priceModifier: 100 },
        { name: 'Navy Blue', hexCode: '#000080', priceModifier: 100 },
      ],
    },
    {
      sku: 'CHR-DIN-001',
      slug: 'scandinavian-dining-chair',
      name: 'Scandinavian Dining Chair',
      description: 'Minimalist dining chair with ergonomic design. Solid wood frame with upholstered seat for comfort during long dinners.',
      category: FurnitureCategory.CHAIRS,
      basePrice: 280,
      width: 50,
      height: 82,
      depth: 55,
      weight: 8,
      leadTimeDays: 14,
      isActive: true,
      isFeatured: false,
      materialOptions: [
        { name: 'Ash Wood', type: 'wood', priceModifier: 0, isDefault: true },
        { name: 'Oak', type: 'wood', priceModifier: 40 },
      ],
      colorOptions: [
        { name: 'Light Grey', hexCode: '#D3D3D3', priceModifier: 0, isDefault: true },
        { name: 'Beige', hexCode: '#F5F5DC', priceModifier: 0 },
        { name: 'Sage Green', hexCode: '#9DC183', priceModifier: 20 },
      ],
    },
    {
      sku: 'BED-PLT-001',
      slug: 'platform-bed-king',
      name: 'Minimalist Platform Bed - King',
      description: 'Clean-lined king size platform bed with integrated headboard. No box spring required. Features solid wood slats for optimal mattress support.',
      category: FurnitureCategory.BEDS,
      basePrice: 1400,
      width: 200,
      height: 90,
      depth: 220,
      weight: 95,
      leadTimeDays: 21,
      isActive: true,
      isFeatured: true,
      materialOptions: [
        { name: 'Oak', type: 'wood', priceModifier: 0, isDefault: true },
        { name: 'Walnut', type: 'wood', priceModifier: 250 },
      ],
      colorOptions: [
        { name: 'Natural Oak', hexCode: '#C4A35A', priceModifier: 0, isDefault: true },
        { name: 'Matte Black', hexCode: '#28282B', priceModifier: 100 },
      ],
    },
    {
      sku: 'STR-TVU-001',
      slug: 'floating-tv-unit',
      name: 'Floating TV Unit',
      description: 'Wall-mounted media console with cable management system. Features soft-close drawers and open shelving for electronics.',
      category: FurnitureCategory.STORAGE,
      basePrice: 850,
      width: 180,
      height: 40,
      depth: 45,
      weight: 45,
      leadTimeDays: 18,
      isActive: true,
      isFeatured: false,
      materialOptions: [
        { name: 'MDF with Veneer', type: 'wood', priceModifier: 0, isDefault: true },
        { name: 'Solid Walnut', type: 'wood', priceModifier: 400 },
      ],
      colorOptions: [
        { name: 'White Matte', hexCode: '#FFFFFF', priceModifier: 0, isDefault: true },
        { name: 'Walnut', hexCode: '#5D432C', priceModifier: 0 },
        { name: 'Black Oak', hexCode: '#2C2C2C', priceModifier: 50 },
      ],
    },
    {
      sku: 'LGT-FLR-001',
      slug: 'arc-floor-lamp',
      name: 'Arc Floor Lamp',
      description: 'Dramatic arc floor lamp with marble base and brass finish. Adjustable height arm extends over seating areas.',
      category: FurnitureCategory.LIGHTING,
      basePrice: 420,
      width: 40,
      height: 200,
      depth: 120,
      weight: 25,
      leadTimeDays: 14,
      isActive: true,
      isFeatured: false,
      materialOptions: [
        { name: 'Brass', type: 'metal', priceModifier: 0, isDefault: true },
        { name: 'Matte Black', type: 'metal', priceModifier: 0 },
        { name: 'Chrome', type: 'metal', priceModifier: 50 },
      ],
      colorOptions: [
        { name: 'White Shade', hexCode: '#FAFAFA', priceModifier: 0, isDefault: true },
        { name: 'Black Shade', hexCode: '#1C1C1C', priceModifier: 0 },
      ],
    },
  ];

  for (const productData of products) {
    const { materialOptions, colorOptions, ...product } = productData;
    
    const createdProduct = await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: {
        ...product,
        materialOptions: {
          create: materialOptions,
        },
        colorOptions: {
          create: colorOptions,
        },
      },
    });
    
    console.log(`✅ Product created: ${createdProduct.name}`);
  }

  console.log('\n🎉 Seeding completed!\n');
  console.log('Test credentials:');
  console.log('  Admin: admin@furniture.com / Admin123!');
  console.log('  Customer: customer@test.com / Customer123!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
