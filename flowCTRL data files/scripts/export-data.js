const path = require("path");
const fs = require("fs");
const { prisma } = require("../../apps/backend/src/lib/prisma");

const EXPORTS_DIR = path.resolve(__dirname, "../exports");

async function exportData() {
  console.log("📦 Exporting flowCTRL user and session data to 'flowCTRL data files/exports'...");

  if (!fs.existsSync(EXPORTS_DIR)) {
    fs.mkdirSync(EXPORTS_DIR, { recursive: true });
  }

  // 1. Export Users (sanitized, excluding passwords and hashes)
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      profile: {
        select: {
          displayName: true,
          headline: true,
          bio: true,
          location: true,
        },
      },
      preferences: {
        select: {
          theme: true,
          emailNotifications: true,
          profileVisibility: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const usersPath = path.join(EXPORTS_DIR, "users.export.json");
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2), "utf-8");
  console.log(`✅ Exported ${users.length} users to: ${usersPath}`);

  // 2. Export Security and Session Logs
  const logs = await prisma.securityLog.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
  });

  const logsPath = path.join(EXPORTS_DIR, "security_logs.export.json");
  fs.writeFileSync(logsPath, JSON.stringify(logs, null, 2), "utf-8");
  console.log(`✅ Exported ${logs.length} security log entries to: ${logsPath}`);

  console.log("\n✨ Data export completed successfully!");
}

exportData()
  .catch((err) => {
    console.error("❌ Export failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
