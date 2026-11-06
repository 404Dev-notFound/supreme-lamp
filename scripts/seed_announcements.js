const { Pool } = require('pg');

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgrespassword9555@localhost:5432/flowCTRL',
});

const ANNOUNCEMENTS = [
  {
    id: 'ann_interview_upcoming',
    title: 'Upcoming Technical Interview: Distributed Systems & Architecture',
    description:
      'Live technical evaluation scheduled with Senior Staff Architecture Panel. Review your verified system design blueprints, database internals, and concurrency patterns.',
    category: 'INTERVIEW',
    dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    priority: 'URGENT',
    status: 'UPCOMING',
    actionLabel: 'Prepare Blueprint',
    actionUrl: '/roadmaps/system-design-architecture',
    badge: 'PRIORITY INTERVIEW',
    isFeatured: true,
    sortOrder: 1,
  },
  {
    id: 'ann_hackathon_codecollab',
    title: 'CodeCollab Global Open-Source Buildathon 2026',
    description:
      '48-hour collaborative engineering sprint hosted across the flowCTRL ecosystem. Build developer tools, databases, and microservices from scratch with peer review.',
    category: 'HACKATHON',
    dateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'HIGH',
    status: 'UPCOMING',
    actionLabel: 'Join Buildathon',
    actionUrl: 'https://opensource-projects.netlify.app',
    badge: 'HACKATHON',
    isFeatured: false,
    sortOrder: 2,
  },
  {
    id: 'ann_community_404_guild',
    title: '404 Tech Guild: Student Project Incubation & Offline Meetup',
    description:
      'Hands-on technical sprint and collaborative mentorship session under the 404 Community Agreement. Code reviews, architecture audits, and project showcases.',
    category: 'COMMUNITY',
    dateTime: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'NORMAL',
    status: 'UPCOMING',
    actionLabel: 'View Guild Agreement',
    actionUrl: '/community-agreement',
    badge: 'OFFLINE GUILD',
    isFeatured: false,
    sortOrder: 3,
  },
  {
    id: 'ann_career_novascale_internship',
    title: 'NovaScale Cloud Systems: Winter Engineering Opportunities',
    description:
      'Partner engineering teams are reviewing verified profiles for junior distributed infrastructure roles. Requires verified ATS resume score above 85%.',
    category: 'CAREER',
    dateTime: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'HIGH',
    status: 'UPCOMING',
    actionLabel: 'Check ATS Resume Match',
    actionUrl: '/resume-screener',
    badge: 'CAREER OPPORTUNITY',
    isFeatured: false,
    sortOrder: 4,
  },
  {
    id: 'ann_platform_privacy_v16',
    title: 'flowCTRL Ecosystem v1.6: Zero-Exposure Security & Resilient Cache',
    description:
      'Platform infrastructure upgraded with automated memory fallback, zero email leakage tokens, and unified multi-language DSA mastery tracking.',
    category: 'PLATFORM',
    dateTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'NORMAL',
    status: 'LIVE',
    actionLabel: 'Explore Ecosystem Hub',
    actionUrl: '/ecosystem',
    badge: 'PLATFORM NOTICE',
    isFeatured: false,
    sortOrder: 5,
  },
  {
    id: 'ann_ecosystem_dsa_expansion',
    title: 'Learning Engine Update: 24 DSA Languages & 1,274 Build Guides',
    description:
      'Explore genuine algorithmic implementations across 24 programming languages and first-principles build guides for databases, compilers, OS, and web servers.',
    category: 'ECOSYSTEM_UPDATE',
    dateTime: new Date().toISOString(),
    priority: 'HIGH',
    status: 'LIVE',
    actionLabel: 'Explore DSA Engine',
    actionUrl: '/dsa',
    badge: 'CATALOG UPDATE',
    isFeatured: false,
    sortOrder: 6,
  },
];

async function seed() {
  try {
    console.log('Connecting to PostgreSQL database...');

    // 1. Create table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "PlatformAnnouncement" (
        "id" TEXT PRIMARY KEY,
        "title" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "dateTime" TIMESTAMP(3) NOT NULL,
        "priority" TEXT NOT NULL DEFAULT 'NORMAL',
        "status" TEXT NOT NULL DEFAULT 'UPCOMING',
        "actionLabel" TEXT,
        "actionUrl" TEXT,
        "badge" TEXT,
        "isFeatured" BOOLEAN NOT NULL DEFAULT false,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "PlatformAnnouncement_category_idx" ON "PlatformAnnouncement"("category");
      CREATE INDEX IF NOT EXISTS "PlatformAnnouncement_priority_idx" ON "PlatformAnnouncement"("priority");
      CREATE INDEX IF NOT EXISTS "PlatformAnnouncement_status_idx" ON "PlatformAnnouncement"("status");
      CREATE INDEX IF NOT EXISTS "PlatformAnnouncement_isFeatured_idx" ON "PlatformAnnouncement"("isFeatured");
    `);

    console.log('Table "PlatformAnnouncement" is ready.');

    // 2. Insert or update announcements
    for (const item of ANNOUNCEMENTS) {
      await pool.query(
        `
        INSERT INTO "PlatformAnnouncement" (
          "id", "title", "description", "category", "dateTime", "priority",
          "status", "actionLabel", "actionUrl", "badge", "isFeatured", "sortOrder", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
        ON CONFLICT ("id") DO UPDATE SET
          "title" = EXCLUDED."title",
          "description" = EXCLUDED."description",
          "category" = EXCLUDED."category",
          "dateTime" = EXCLUDED."dateTime",
          "priority" = EXCLUDED."priority",
          "status" = EXCLUDED."status",
          "actionLabel" = EXCLUDED."actionLabel",
          "actionUrl" = EXCLUDED."actionUrl",
          "badge" = EXCLUDED."badge",
          "isFeatured" = EXCLUDED."isFeatured",
          "sortOrder" = EXCLUDED."sortOrder",
          "updatedAt" = CURRENT_TIMESTAMP;
      `,
        [
          item.id,
          item.title,
          item.description,
          item.category,
          item.dateTime,
          item.priority,
          item.status,
          item.actionLabel,
          item.actionUrl,
          item.badge,
          item.isFeatured,
          item.sortOrder,
        ]
      );
    }

    const { rows } = await pool.query('SELECT count(*) FROM "PlatformAnnouncement"');
    console.log(`Successfully seeded ${rows[0].count} platform announcements and notifications into PostgreSQL.`);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seed();

