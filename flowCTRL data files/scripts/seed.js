const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const { prisma } = require("../../apps/backend/src/lib/prisma");

const SEEDS_DIR = path.resolve(__dirname, "../seeds");
const DEFAULT_PASSWORD = "Password123!";

async function seedCategoriesAndSkills() {
  const catPath = path.join(SEEDS_DIR, "categories.json");
  const skillsPath = path.join(SEEDS_DIR, "skills.json");

  if (fs.existsSync(catPath)) {
    const rawCats = JSON.parse(fs.readFileSync(catPath, "utf-8"));
    for (const cat of rawCats) {
      await prisma.category.upsert({
        where: { name: cat.name },
        update: {
          slug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, "-"),
          description: cat.description || null,
        },
        create: {
          name: cat.name,
          slug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, "-"),
          description: cat.description || null,
        },
      });
    }
    console.log(`✅ Seeded / verified ${rawCats.length} categories.`);
  }

  if (fs.existsSync(skillsPath)) {
    const rawSkills = JSON.parse(fs.readFileSync(skillsPath, "utf-8"));
    let count = 0;
    for (const s of rawSkills) {
      await prisma.skill.upsert({
        where: { name: s.name },
        update: { category: s.category || "General" },
        create: {
          name: s.name,
          category: s.category || "General",
          description: s.description || null,
        },
      });
      count++;
    }
    console.log(`✅ Seeded / verified ${count} skills in shared catalog.`);
  }
}

async function seedUsers() {
  const usersPath = path.join(SEEDS_DIR, "users.seed.json");
  if (!fs.existsSync(usersPath)) {
    console.warn("⚠️  User seed file not found:", usersPath);
    return;
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
}

async function seedProjects() {
  const projectsPath = path.join(SEEDS_DIR, "projects.seed.json");
  if (!fs.existsSync(projectsPath)) {
    console.warn("⚠️  Project seed file not found:", projectsPath);
    return;
  }

  const rawProjects = JSON.parse(fs.readFileSync(projectsPath, "utf-8"));

  for (const p of rawProjects) {
    let ownerId = null;
    if (p.ownerEmail) {
      const owner = await prisma.user.findUnique({
        where: { email: p.ownerEmail },
        select: { id: true },
      });
      if (owner) {
        ownerId = owner.id;
      }
    }

    const existingProject = await prisma.project.findUnique({
      where: { id: p.id },
    });

    let projectRecord;
    if (existingProject) {
      projectRecord = await prisma.project.update({
        where: { id: p.id },
        data: {
          title: p.title,
          category: p.category || "General",
          difficulty: p.difficulty || "Intermediate",
          techStack: p.techStack || [],
          image: p.image || null,
          description: p.description || null,
          githubUrl: p.githubUrl || null,
          isPinned: p.isPinned || false,
          isDemo: p.isDemo || false,
          ownerId: ownerId || existingProject.ownerId,
        },
      });
      console.log(`ℹ️  Updated existing project: ${projectRecord.title}`);
    } else {
      projectRecord = await prisma.project.create({
        data: {
          id: p.id,
          title: p.title,
          category: p.category || "General",
          difficulty: p.difficulty || "Intermediate",
          techStack: p.techStack || [],
          image: p.image || null,
          description: p.description || null,
          githubUrl: p.githubUrl || null,
          isPinned: p.isPinned || false,
          isDemo: p.isDemo || false,
          ownerId,
          ...(ownerId && {
            members: {
              create: {
                userId: ownerId,
                projectRole: "owner",
              },
            },
          }),
        },
      });
      console.log(`✅ Seeded project: ${projectRecord.title} (ID: ${projectRecord.id})`);
    }

    // Seed issues for this project
    if (Array.isArray(p.issues)) {
      for (const issue of p.issues) {
        const existingIssue = await prisma.issue.findUnique({
          where: { id: issue.id },
        });

        if (!existingIssue) {
          await prisma.issue.create({
            data: {
              id: issue.id,
              title: issue.title,
              description: issue.description || "",
              status: issue.status || "TODO",
              priority: issue.priority || "MEDIUM",
              tags: issue.tags || [],
              projectId: projectRecord.id,
              creatorId: ownerId,
            },
          });
          console.log(`   └─ ✅ Seeded issue: ${issue.title} [${issue.status}]`);
        }
      }
    }
  }
}

async function main() {
  console.log("🌱 Starting flowCTRL database seeding from 'flowCTRL data files/seeds'...");

  await seedCategoriesAndSkills();
  await seedUsers();
  await seedProjects();

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
