const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const { prisma } = require("../../apps/backend/src/lib/prisma");

const SEEDS_DIR = path.resolve(__dirname, "../seeds");
const DEFAULT_PASSWORD = "Password123!";

async function main() {
  console.log("🌱 Starting flowCTRL database seeding from 'flowCTRL data files/seeds'...");

  const usersPath = path.join(SEEDS_DIR, "users.seed.json");
  if (!fs.existsSync(usersPath)) {
    console.error("❌ Seed file not found:", usersPath);
    process.exit(1);
  }

  const rawUsers = JSON.parse(fs.readFileSync(usersPath, "utf-8"));
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  for (const item of rawUsers) {
    const existing = await prisma.user.findUnique({
      where: { email: item.email },
    });

    if (existing) {
      console.log(`ℹ️  User already exists: ${item.email} (${item.role})`);
      continue;
    }

    const created = await prisma.user.create({
      data: {
        id: item.id,
        name: item.name,
        email: item.email,
        password: hashedPassword,
        role: item.role,
        status: item.status || "ACTIVE",
        profile: {
          create: {
            displayName: item.name,
            headline: item.headline || "",
            bio: item.bio || "",
            location: item.location || "",
          },
        },
        preferences: {
          create: {
            theme: item.theme || "dark",
            emailNotifications: true,
            profileVisibility: "PUBLIC",
          },
        },
        securityLogs: {
          create: {
            eventType: "seed_initialized",
            ipAddress: "127.0.0.1",
            userAgent: "flowCTRL Seeder",
            details: { role: item.role },
          },
        },
      },
    });

    console.log(`✅ Seeded user: ${created.name} <${created.email}> [Role: ${created.role}]`);
  }

  console.log("\n✨ Database seeding completed successfully!");
}

main()
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
