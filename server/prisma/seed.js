/**
 * Prisma seed script for Bellissimo Couture
 * Run: npm run seed  (or)  npx prisma db seed
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const slugify = require('slugify');

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: 'Designer Coats', slug: 'designer-coats', description: 'Premium wool, trench, and overcoats' },
  { name: 'Pants & Trousers', slug: 'pants', description: 'Formal, casual, chinos, linen' },
  { name: 'Sherwani', slug: 'sherwani', description: 'Traditional Indian occasion wear' },
  { name: 'Blazers', slug: 'blazers', description: 'Casual, formal, printed blazers' },
  { name: 'Suits', slug: 'suits', description: '2-piece and 3-piece suits' },
  { name: 'Tuxedos', slug: 'tuxedos', description: 'Black tie and formal tuxedos' },
  { name: 'Kurta Sets', slug: 'kurta-sets', description: 'Ethnic festive wear' },
  { name: 'Jackets', slug: 'jackets', description: 'Bombers, denim, leather jackets' },
  { name: 'Shirts', slug: 'shirts', description: 'Formal, casual, party shirts' },
  { name: 'T-Shirts', slug: 't-shirts', description: 'Polo, printed, plain' },
  { name: 'Accessories', slug: 'accessories', description: 'Ties, pocket squares, cufflinks, belts' },
];

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const COLORS = [
  { color: 'Black', hex: '#000000' },
  { color: 'Navy', hex: '#0A1F44' },
  { color: 'Charcoal', hex: '#36454F' },
  { color: 'Beige', hex: '#F5F5DC' },
];

const placeholderImage = (seed) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/800/1000`;

function buildProducts(category, index) {
  const base = `${category.name} Style ${index + 1}`;
  const slug = slugify(`${category.slug}-style-${index + 1}`, { lower: true, strict: true });
  const price = 2000 + Math.floor(Math.random() * 15000);
  const discountPercent = [0, 10, 20, 30][Math.floor(Math.random() * 4)];
  const discountPrice =
    discountPercent > 0 ? Number((price - (price * discountPercent) / 100).toFixed(2)) : null;

  return {
    name: base,
    slug,
    description: `Premium ${category.name.toLowerCase()} crafted by Bellissimo Couture. Tailored fit, superior fabric, and refined finish.`,
    price,
    discountPrice,
    discountPercent: discountPercent || null,
    fabric: [['Cotton', 'Wool', 'Silk', 'Linen'][index % 4]],
    fit: [['Slim Fit', 'Regular Fit', 'Tailored Fit'][index % 3]],
    occasion: [['Formal', 'Casual', 'Wedding', 'Party', 'Business'][index % 5]],
    careInstructions: 'Dry clean only. Iron on low heat.',
    tags: ['new', 'trending'],
    stock: 50,
    isFeatured: index < 2,
    isNewArrival: index < 3,
  };
}

async function main() {
  console.log('Seeding database...');

  // Admin user
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@bellissimocouture.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@bellissimocouture.com',
      password: adminPassword,
      role: 'ADMIN',
      isVerified: true,
    },
  });
  console.log('Admin seeded: admin@bellissimocouture.com / Admin@123');

  // Categories
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: placeholderImage(cat.slug),
      },
    });
  }
  console.log(`Categories seeded: ${CATEGORIES.length}`);

  // Products (5 per category)
  const categories = await prisma.category.findMany();
  for (const category of categories) {
    for (let i = 0; i < 5; i++) {
      const data = buildProducts(category, i);
      const existing = await prisma.product.findUnique({ where: { slug: data.slug } });
      if (existing) continue;

      await prisma.product.create({
        data: {
          ...data,
          categories: { connect: [{ id: category.id }] },
          images: {
            create: [
              { url: placeholderImage(`${data.slug}-1`), isPrimary: true, order: 0 },
              { url: placeholderImage(`${data.slug}-2`), order: 1 },
            ],
          },
          variants: {
            create: SIZES.flatMap((size) =>
              COLORS.map((c) => ({
                size,
                color: c.color,
                colorHex: c.hex,
                stock: 10,
                sku: `${data.slug}-${size}-${c.color}`.toUpperCase(),
              }))
            ),
          },
        },
      });
    }
  }
  console.log('Products seeded');

  // Banners
  const bannerCount = await prisma.banner.count();
  if (bannerCount === 0) {
    await prisma.banner.createMany({
      data: [
        {
          title: 'Wedding Collection 2026',
          subtitle: 'Up to 40% off on Sherwanis',
          image: placeholderImage('banner-1'),
          link: '/shop?category=sherwani',
          position: 1,
        },
        {
          title: 'New Arrivals',
          subtitle: 'Fresh designer coats for the season',
          image: placeholderImage('banner-2'),
          link: '/shop?category=designer-coats',
          position: 2,
        },
        {
          title: 'Formal Essentials',
          subtitle: 'Tailored suits and blazers',
          image: placeholderImage('banner-3'),
          link: '/shop?category=suits',
          position: 3,
        },
      ],
    });
    console.log('Banners seeded');
  }

  // Coupons
  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      description: '10% off for new customers',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: 1000,
      maxDiscount: 1500,
      usageLimit: 1000,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'FLAT500' },
    update: {},
    create: {
      code: 'FLAT500',
      description: 'Flat Rs.500 off on orders above Rs.3000',
      discountType: 'FLAT',
      discountValue: 500,
      minOrderAmount: 3000,
      usageLimit: 500,
    },
  });
  console.log('Coupons seeded');

  console.log('Seeding complete.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
