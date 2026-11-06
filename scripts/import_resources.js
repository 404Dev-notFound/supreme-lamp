/**
 * Idempotent import pipeline for unified_resources.json -> PremiumResource & ResourceCategory tables.
 * 
 * Usage: node scripts/import_resources.js
 */

const fs = require('fs');
const path = require('path');
const { PrismaPg } = require(path.resolve(__dirname, '..', 'node_modules', '@prisma', 'adapter-pg'));
const { Pool } = require('pg');
const { PrismaClient } = require(path.resolve(__dirname, '..', 'node_modules', '@prisma', 'client'));

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword9555@localhost:5432/flowCTRL';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter, log: ['warn', 'error'] });

const DATA_FILE = path.resolve(__dirname, '..', 'data', 'unified_resources.json');
const BATCH_SIZE = 100;

async function run() {
  console.log('--- Starting Resources DB Import ---');
  if (!fs.existsSync(DATA_FILE)) {
    throw new Error(`Data file not found: ${DATA_FILE}`);
  }

  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  const items = JSON.parse(raw);
  console.log(`Loaded ${items.length} resources from ${DATA_FILE}`);

  // 1. Ensure Categories exist
  const categoriesMap = new Map();
  const categoryDefs = [
    { slug: 'books', name: 'Books', description: 'Curated programming books and reference texts', icon: 'BookOpen' },
    { slug: 'documentation', name: 'Documentation', description: 'Official developer documentation and specifications', icon: 'FileText' },
    { slug: 'courses-tutorials', name: 'Courses & Tutorials', description: 'Free comprehensive video and structured text courses', icon: 'GraduationCap' },
    { slug: 'cheatsheets', name: 'Cheatsheets', description: 'Fast syntax, command, and architecture reference sheets', icon: 'FileCode' },
    { slug: 'interactive-practice', name: 'Interactive Practice', description: 'Interactive learning playgrounds, problem sets, and hands-on environments', icon: 'PlayCircle' },
    { slug: 'system-architecture', name: 'System Architecture', description: 'Foundational research whitepapers and distributed system designs', icon: 'Layers' },
    { slug: 'awesome', name: 'Curated Awesome', description: 'Community-verified awesome curated developer indexes', icon: 'Sparkles' },
    { slug: 'podcasts', name: 'Podcasts & Screencasts', description: 'Engineering podcasts, audio walkthroughs, and screencasts', icon: 'Headphones' },
  ];

  for (const c of categoryDefs) {
    const record = await prisma.resourceCategory.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, icon: c.icon },
      create: { slug: c.slug, name: c.name, description: c.description, icon: c.icon },
    });
    categoriesMap.set(c.slug, record.id);
  }
  console.log(`Ensured ${categoryDefs.length} resource categories.`);

  let createdCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const chunk = items.slice(i, i + BATCH_SIZE);
    
    await Promise.all(
      chunk.map(async (item) => {
        try {
          const catId = categoriesMap.get(item.categorySlug) || null;
          const isAdvanced = item.level === 'Advanced';
          const accessLevel = item.accessLevel || (isAdvanced ? 'PREMIUM' : 'FREE');

          const data = {
            title: item.title,
            description: item.description || `${item.title} by ${item.author}`,
            categorySlug: item.categorySlug,
            categoryId: catId,
            accessLevel,
            level: item.level || 'Intermediate',
            badge: accessLevel === 'PREMIUM' ? 'PREMIUM' : item.type || 'FREE',
            iconName: item.format === 'PDF' ? 'FileText' : 'BookOpen',
            estimatedHours: 15,
            topicsCount: Array.isArray(item.tags) ? item.tags.length : 1,
            externalUrl: item.externalUrl || item.url,
            content: {
              author: item.author,
              type: item.type,
              format: item.format,
              language: item.language,
              rating: item.rating,
              tags: item.tags,
              url: item.externalUrl || item.url,
              overview: item.description,
            },
            isActive: true,
            isFeatured: item.rating >= 4.9,
            isPinned: false,
          };

          const existing = await prisma.premiumResource.findUnique({
            where: { slug: item.slug },
            select: { id: true },
          });

          if (existing) {
            await prisma.premiumResource.update({
              where: { slug: item.slug },
              data,
            });
            updatedCount++;
          } else {
            await prisma.premiumResource.create({
              data: {
                slug: item.slug,
                ...data,
              },
            });
            createdCount++;
          }
        } catch (err) {
          errorCount++;
          if (errorCount <= 5) {
            console.error(`Error importing ${item.slug}:`, err.message);
          }
        }
      })
    );

    if ((i + BATCH_SIZE) % 500 === 0 || i + BATCH_SIZE >= items.length) {
      console.log(`Processed ${Math.min(i + BATCH_SIZE, items.length)} / ${items.length} resources...`);
    }
  }

  console.log(`\n--- DB Import Finished ---`);
  console.log(`Created: ${createdCount}`);
  console.log(`Updated: ${updatedCount}`);
  console.log(`Errors: ${errorCount}`);
  const finalCount = await prisma.premiumResource.count();
  console.log(`Total PremiumResource records in DB: ${finalCount}`);
}

run()
  .catch((e) => {
    console.error('Fatal error in import_resources:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

