import { connectDb } from '../config/db.js';
import { env } from '../config/env.js';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { Settings } from '../models/Settings.js';
import { User } from '../models/User.js';
import { hashPassword } from '../services/auth.service.js';
import { slugify } from '../utils/slugify.js';
import { Banner } from '../models/Banner.js';
import { banners, categories, marqueeItems, products } from './catalog.js';

await connectDb();

if (!env.seed.email || !env.seed.password) {
  throw new Error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD before seeding.');
}

const passwordHash = await hashPassword(env.seed.password);
await User.findOneAndUpdate(
  { email: env.seed.email.toLowerCase() },
  { name: env.seed.name, email: env.seed.email.toLowerCase(), passwordHash, role: 'admin' },
  { upsert: true, new: true },
);

await Settings.findOneAndUpdate(
  {},
  {
    shopName: 'Deepam Crackers',
    tagline: 'Choose your favourite crackers and place your order directly through WhatsApp.',
    marqueeEnabled: true,
    marqueeItems,
    whatsappGreeting: 'Hello Deepam Crackers, I would like to know more about your Diwali crackers and offers.',
    isOrderingOpen: true,
    whatsappNumber: env.whatsappNumber,
    contactPhone: env.whatsappNumber ? `+${env.whatsappNumber}` : '',
    email: 'hello@deepamcrackers.test',
    address: '12 Temple Street, Sivakasi',
    about: 'Deepam Crackers is a seasonal Diwali shop. Browse the catalog, build a small order, and send it on WhatsApp. There is no account to create and no payment inside this website.',
    safetyNote: 'Light crackers in an open space, follow local rules, and keep children supervised by an adult.',
  },
  { upsert: true, setDefaultsOnInsert: true },
);

for (const [index, banner] of banners.entries()) {
  await Banner.findOneAndUpdate(
    { title: banner.title },
    { ...banner, displayOrder: index + 1, isActive: true },
    { upsert: true, setDefaultsOnInsert: true },
  );
}

const categoryIds = new Map();
for (const item of categories) {
  const category = await Category.findOneAndUpdate(
    { slug: slugify(item.name) },
    {
      name: item.name,
      slug: slugify(item.name),
      description: item.description,
      imageUrl: item.image,
      ageGroup: item.ageGroup,
      displayOrder: item.displayOrder,
      isActive: true,
    },
    { upsert: true, new: true },
  );
  categoryIds.set(item.name, category._id);
}

for (const item of products) {
  const categoryId = categoryIds.get(item.category);
  const finalPrice = Math.round(item.originalPrice * (1 - item.discountPercentage / 100));
  await Product.findOneAndUpdate(
    { slug: slugify(item.name) },
    {
      name: item.name,
      slug: slugify(item.name),
      description: item.description,
      categoryId,
      ageGroup: item.ageGroup,
      unit: item.unit,
      imageUrl: item.image || categories.find((category) => category.name === item.category)?.image || '',
      originalPrice: item.originalPrice,
      discountPercentage: item.discountPercentage,
      finalPrice,
      isActive: true,
      stockStatus: item.stockStatus,
      stockQuantity: item.stockQuantity,
    },
    { upsert: true, new: true },
  );
}

console.log(`Seeded admin ${env.seed.email}, ${categories.length} categories, and ${products.length} products.`);
process.exit(0);
