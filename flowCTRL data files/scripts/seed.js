/**
 * flowCTRL Enterprise Database Seeder
 * ===================================
 * Idempotent, development-only seed system covering all 35 models across the flowCTRL schema.
 * Engineering standard: Google / Microsoft / Apple Production Database Architect specification.
 *
 * Scenarios:
 *  - Administrative (System Administrator: Active Premium Annual)
 *  - Active Premium (Alex Johnson: Active Premium Monthly)
 *  - Active Free (Elena Rostova: Free Account)
 *  - Expired Membership (Devin Clark: Expired Premium for downgrade validation)
 *  - Mentor Profile (Sarah Lin: Staff AI Engineer & Mentor)
 *  - Recruiter Persona (Marcus Vance: Technical Talent Partner)
 *
 * Safety:
 *  - Hard-fails if executed in NODE_ENV === 'production' unless explicitly permitted via ALLOW_SEED='true'.
 *  - 100% fictional data with zero real credentials, PII, or actual payment card numbers.
 *  - Idempotent execution (upsert / find-or-create). Safe to execute repeatedly.
 */

const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { prisma } = require("../../apps/backend/src/lib/prisma");

// ==========================================
// 0. PRODUCTION SAFEGUARD
// ==========================================
if (process.env.NODE_ENV === "production" && process.env.ALLOW_SEED !== "true") {
  console.error("🛑 [FATAL] Database seeding is BLOCKED in production environment.");
  console.error("To explicitly allow seeding in non-standard production tests, set ALLOW_SEED=true.");
  process.exit(1);
}

const SEEDS_DIR = path.resolve(__dirname, "../seeds");
const DEFAULT_PASSWORD = "Password123!";

// Helper to generate deterministic or unique mock references
function mockHash(seed) {
  return crypto.createHash("sha256").update(seed).digest("hex").slice(0, 32);
}

// ==========================================
// 1. SKILLS, CATEGORIES & CAREER PATHS
// ==========================================
async function seedCatalog() {
  console.log("\n📦 [1/11] Seeding Shared Catalog (Categories, Career Paths, Skills)...");

  // 1.1 Categories
  const categoryData = [
    { name: "Frontend Development", slug: "frontend-development", description: "Modern UI engineering, SPA frameworks, and web ergonomics." },
    { name: "Backend Development", slug: "backend-development", description: "Distributed web services, REST/gRPC APIs, and concurrency." },
    { name: "DevOps & Cloud", slug: "devops-cloud", description: "Container orchestration, CI/CD pipelines, and cloud infrastructure." },
    { name: "Database Engineering", slug: "database-engineering", description: "Relational persistence, query tuning, and distributed storage." },
    { name: "Cybersecurity", slug: "cybersecurity", description: "Threat modeling, OWASP hardening, identity, and cryptography." },
    { name: "AI & Machine Learning", slug: "ai-machine-learning", description: "LLMs, embeddings, RAG pipelines, and model fine-tuning." },
  ];

  const catMap = {};
  for (const c of categoryData) {
    const rec = await prisma.category.upsert({
      where: { name: c.name },
      update: { slug: c.slug, description: c.description },
      create: { name: c.name, slug: c.slug, description: c.description },
    });
    catMap[c.slug] = rec.id;
  }

  // 1.2 Career Paths
  const careerPaths = [
    { title: "Senior Full-Stack Architect", slug: "senior-full-stack-architect", level: "Senior", description: "End-to-end distributed system leadership, high-throughput microservices, and reactive web applications." },
    { title: "Cloud Native Platform & SRE Specialist", slug: "cloud-native-platform-sre", level: "Lead", description: "Kubernetes ecosystem, multi-region fault tolerance, zero-downtime releases, and observability." },
    { title: "AI Systems & RAG Engineer", slug: "ai-systems-rag-engineer", level: "Mid-Level", description: "Vector databases, agentic pipelines, local model inference, and hybrid search architectures." },
  ];

  for (const cp of careerPaths) {
    await prisma.careerPath.upsert({
      where: { slug: cp.slug },
      update: { title: cp.title, description: cp.description, level: cp.level },
      create: { title: cp.title, slug: cp.slug, description: cp.description, level: cp.level },
    });
  }

  // 1.3 Skills
  const coreSkills = [
    { name: "TypeScript", category: "Frontend Development", catSlug: "frontend-development" },
    { name: "React", category: "Frontend Development", catSlug: "frontend-development" },
    { name: "Next.js", category: "Frontend Development", catSlug: "frontend-development" },
    { name: "Node.js", category: "Backend Development", catSlug: "backend-development" },
    { name: "PostgreSQL", category: "Database Engineering", catSlug: "database-engineering" },
    { name: "Prisma ORM", category: "Database Engineering", catSlug: "database-engineering" },
    { name: "Docker", category: "DevOps & Cloud", catSlug: "devops-cloud" },
    { name: "Kubernetes", category: "DevOps & Cloud", catSlug: "devops-cloud" },
    { name: "Redis", category: "Database Engineering", catSlug: "database-engineering" },
    { name: "GraphQL", category: "Backend Development", catSlug: "backend-development" },
    { name: "Python", category: "AI & Machine Learning", catSlug: "ai-machine-learning" },
    { name: "Vector Embeddings", category: "AI & Machine Learning", catSlug: "ai-machine-learning" },
    { name: "OWASP Hardening", category: "Cybersecurity", catSlug: "cybersecurity" },
  ];

  const skillMap = {};
  for (const s of coreSkills) {
    const rec = await prisma.skill.upsert({
      where: { name: s.name },
      update: { category: s.category, categoryId: catMap[s.catSlug] || null },
      create: { name: s.name, category: s.category, categoryId: catMap[s.catSlug] || null },
    });
    skillMap[s.name] = rec.id;
  }

  console.log(`   └─ ✅ Catalog verified (${categoryData.length} categories, ${careerPaths.length} career paths, ${coreSkills.length} skills).`);
  return { catMap, skillMap };
}

// ==========================================
// 2. USERS, PROFILES, PREFERENCES & SESSIONS
// ==========================================
async function seedUsers(skillMap) {
  console.log("\n👤 [2/11] Seeding User Personas, Profiles, Sessions & Security Logs...");

  const usersPath = path.join(SEEDS_DIR, "users.seed.json");
  const rawUsers = JSON.parse(fs.readFileSync(usersPath, "utf-8"));
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const userMap = {};

  for (const item of rawUsers) {
    let user = await prisma.user.findUnique({
      where: { email: item.email },
      include: { profile: true, preferences: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: item.id,
          name: item.name,
          email: item.email,
          password: hashedPassword,
          role: item.role,
          status: item.status || "ACTIVE",
          headline: item.headline,
          bio: item.bio,
          location: item.location,
          profile: {
            create: {
              displayName: item.name,
              headline: item.headline,
              bio: item.bio,
              location: item.location,
              websiteUrl: `https://${item.email.split("@")[0]}.flowctrl.dev`,
              githubUrl: `https://github.com/flowctrl-${item.email.split("@")[0]}`,
            },
          },
          preferences: {
            create: {
              theme: item.theme || "dark",
              emailNotifications: true,
              profileVisibility: "PUBLIC",
            },
          },
        },
        include: { profile: true, preferences: true },
      });
      console.log(`   └─ Created persona: ${user.name} <${user.email}> [${user.role}]`);
    } else {
      // Ensure profile and preferences exist idempotently
      await prisma.userProfile.upsert({
        where: { userId: user.id },
        update: { headline: item.headline, bio: item.bio, location: item.location },
        create: {
          userId: user.id,
          displayName: item.name,
          headline: item.headline,
          bio: item.bio,
          location: item.location,
        },
      });

      await prisma.userPreference.upsert({
        where: { userId: user.id },
        update: { theme: item.theme || "dark" },
        create: {
          userId: user.id,
          theme: item.theme || "dark",
          emailNotifications: true,
          profileVisibility: "PUBLIC",
        },
      });
    }

    userMap[user.email] = user;

    // Seed User Skills
    const userSkillNames = item.role === "MENTOR"
      ? ["Python", "Vector Embeddings", "PostgreSQL", "Kubernetes"]
      : item.email === "alex@flowctrl.dev"
      ? ["TypeScript", "React", "Node.js", "PostgreSQL", "Docker"]
      : ["React", "TypeScript"];

    for (const sName of userSkillNames) {
      if (skillMap[sName]) {
        await prisma.userSkill.upsert({
          where: { userId_skillId: { userId: user.id, skillId: skillMap[sName] } },
          update: { proficiency: 4, isVerified: true },
          create: {
            userId: user.id,
            skillId: skillMap[sName],
            proficiency: 4,
            isVerified: true,
          },
        });
      }
    }

    // Seed OAuth Account record (Mock GitHub Account)
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: "github",
          providerAccountId: `gh_${mockHash(user.email).slice(0, 12)}`,
        },
      },
      update: {},
      create: {
        userId: user.id,
        type: "oauth",
        provider: "github",
        providerAccountId: `gh_${mockHash(user.email).slice(0, 12)}`,
        access_token: `gho_${mockHash(user.email)}`,
        token_type: "Bearer",
        scope: "read:user,user:email",
      },
    });

    // Seed NextAuth Session
    const sessionToken = `sess_${mockHash(user.email)}`;
    await prisma.session.upsert({
      where: { sessionToken },
      update: { expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      create: {
        sessionToken,
        userId: user.id,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Seed Enterprise UserSession (Device Security)
    const deviceToken = `usr_sess_${mockHash(user.email + "_device")}`;
    await prisma.userSession.upsert({
      where: { sessionToken: deviceToken },
      update: { lastActiveAt: new Date(), expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
      create: {
        userId: user.id,
        sessionToken: deviceToken,
        ipAddress: "127.0.0.1",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        deviceType: "Desktop",
        browser: "Chrome 128.0",
        os: "Windows 11 Enterprise",
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    // Seed Security Logs
    const existingLog = await prisma.securityLog.findFirst({
      where: { userId: user.id, eventType: "seed_initialized" },
    });
    if (!existingLog) {
      await prisma.securityLog.create({
        data: {
          userId: user.id,
          eventType: "seed_initialized",
          ipAddress: "127.0.0.1",
          userAgent: "flowCTRL Enterprise Seeder",
          details: { scenario: item.membershipScenario || "standard" },
        },
      });
    }
  }

  // Seed Email Verification Token
  await prisma.verificationToken.upsert({
    where: { token: "verify_token_dummy_seed_qa_flowctrl" },
    update: { expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    create: {
      identifier: "free.dev@flowctrl.dev",
      token: "verify_token_dummy_seed_qa_flowctrl",
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return userMap;
}

// ==========================================
// 3. MEMBERSHIP PLANS, SUBSCRIPTIONS & TRANSACTIONS
// ==========================================
async function seedMemberships(userMap) {
  console.log("\n💳 [3/11] Seeding Membership Plans, Subscriptions, History & Transactions...");

  // 3.1 Membership Plans
  const plans = [
    {
      code: "FREE",
      name: "Community Free",
      description: "Core access to community roadmaps, interactive code workspaces, and public resources.",
      tier: "FREE",
      price: 0.00,
      interval: null,
      features: ["All Community Roadmaps", "Standard Resume Analyzer", "Job Board Browsing", "Public Discussions"],
      sortOrder: 0,
    },
    {
      code: "PREMIUM_MONTHLY",
      name: "flowCTRL Pro (Monthly)",
      description: "Full access to advanced curated resources, AI deep-dive modules, and priority job matching.",
      tier: "PREMIUM",
      price: 29.00,
      interval: "month",
      features: ["All Curated Premium Modules", "AI Architectural Deep Dives", "Unlimited Resume Scoring", "Verified Mentor Matching", "Ad-Free Experience"],
      sortOrder: 1,
    },
    {
      code: "PREMIUM_ANNUAL",
      name: "flowCTRL Pro (Annual)",
      description: "Enterprise & professional tier with complete access to all current and future specialized curriculums.",
      tier: "PREMIUM",
      price: 290.00,
      interval: "year",
      features: ["Everything in Pro Monthly", "Two Months Free Included", "Direct Mentor Office Hours", "Early Access to New Tracks", "Verifiable Completion Badges"],
      sortOrder: 2,
    },
  ];

  const planMap = {};
  for (const p of plans) {
    const rec = await prisma.membershipPlan.upsert({
      where: { code: p.code },
      update: {
        name: p.name,
        description: p.description,
        tier: p.tier,
        price: p.price,
        currency: "USD",
        interval: p.interval,
        features: p.features,
        isActive: true,
        sortOrder: p.sortOrder,
      },
      create: {
        code: p.code,
        name: p.name,
        description: p.description,
        tier: p.tier,
        price: p.price,
        currency: "USD",
        interval: p.interval,
        features: p.features,
        isActive: true,
        sortOrder: p.sortOrder,
      },
    });
    planMap[p.code] = rec;
  }

  // 3.2 User Memberships Scenarios
  const scenarios = [
    {
      email: "admin@flowctrl.dev",
      planCode: "PREMIUM_ANNUAL",
      tier: "PREMIUM",
      status: "ACTIVE",
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      autoRenew: true,
      amount: 290.00,
    },
    {
      email: "alex@flowctrl.dev",
      planCode: "PREMIUM_MONTHLY",
      tier: "PREMIUM",
      status: "ACTIVE",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      autoRenew: true,
      amount: 29.00,
    },
    {
      email: "expired.member@flowctrl.dev",
      planCode: "PREMIUM_MONTHLY",
      tier: "PREMIUM",
      status: "EXPIRED",
      expiresAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Expired 7 days ago
      autoRenew: false,
      amount: 29.00,
    },
    {
      email: "free.dev@flowctrl.dev",
      planCode: "FREE",
      tier: "FREE",
      status: "ACTIVE",
      expiresAt: null,
      autoRenew: false,
      amount: 0.00,
    },
    {
      email: "mentor@flowctrl.dev",
      planCode: "FREE",
      tier: "FREE",
      status: "ACTIVE",
      expiresAt: null,
      autoRenew: false,
      amount: 0.00,
    },
    {
      email: "recruiter@flowctrl.dev",
      planCode: "FREE",
      tier: "FREE",
      status: "ACTIVE",
      expiresAt: null,
      autoRenew: false,
      amount: 0.00,
    },
  ];

  for (const s of scenarios) {
    const user = userMap[s.email];
    if (!user) continue;

    const plan = planMap[s.planCode];

    const membership = await prisma.userMembership.upsert({
      where: { userId: user.id },
      update: {
        planId: plan.id,
        tier: s.tier,
        status: s.status,
        expiresAt: s.expiresAt,
        autoRenew: s.autoRenew,
        lastVerifiedAt: new Date(),
      },
      create: {
        userId: user.id,
        planId: plan.id,
        tier: s.tier,
        status: s.status,
        expiresAt: s.expiresAt,
        autoRenew: s.autoRenew,
      },
    });

    // History record
    const existingHistory = await prisma.membershipHistory.findFirst({
      where: { userId: user.id, planId: plan.id },
    });
    if (!existingHistory) {
      await prisma.membershipHistory.create({
        data: {
          userId: user.id,
          planId: plan.id,
          action: s.status === "EXPIRED" ? "EXPIRED" : s.tier === "PREMIUM" ? "ACTIVATED" : "PROVISIONED",
          tier: s.tier,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: s.expiresAt,
          note: `Seed membership scenario: ${s.tier} (${s.status})`,
        },
      });
    }

    // Transaction record (for paid scenarios)
    if (s.amount > 0) {
      const existingTxn = await prisma.membershipTransaction.findFirst({
        where: { userId: user.id, membershipId: membership.id },
      });
      if (!existingTxn) {
        await prisma.membershipTransaction.create({
          data: {
            userId: user.id,
            membershipId: membership.id,
            amount: s.amount,
            currency: "USD",
            status: "COMPLETED",
            paymentMethod: "card",
            providerReference: `mock_txn_${mockHash(user.email).slice(0, 16)}`,
          },
        });
      }
    }
  }

  console.log(`   └─ ✅ Memberships verified (${scenarios.length} test scenarios seeded with Decimal financial transactions).`);
}

// ==========================================
// 4. RESOURCE CATEGORIES & PREMIUM RESOURCES
// ==========================================
async function seedPremiumResources() {
  console.log("\n📚 [4/11] Seeding Resource Categories & Premium Curriculums...");

  const resourcesPath = path.join(SEEDS_DIR, "premium_resources.seed.json");
  const rawResources = JSON.parse(fs.readFileSync(resourcesPath, "utf-8"));

  const categoryDefinitions = {
    "backend-cloud": { name: "Backend & Cloud Architecture", icon: "Server", sortOrder: 1 },
    "security": { name: "Cybersecurity & Systems Hardening", icon: "ShieldCheck", sortOrder: 2 },
    "ai-intelligence": { name: "AI Engineering & Machine Learning", icon: "Brain", sortOrder: 3 },
    "devops-cloud": { name: "Platform Engineering & SRE", icon: "Layers", sortOrder: 4 },
    "computer-science": { name: "Core Computer Science & Systems", icon: "Binary", sortOrder: 5 },
    "databases-storage": { name: "Databases & Distributed Storage", icon: "Database", sortOrder: 6 },
  };

  const catMap = {};
  for (const [slug, def] of Object.entries(categoryDefinitions)) {
    const cat = await prisma.resourceCategory.upsert({
      where: { slug },
      update: { name: def.name, icon: def.icon, sortOrder: def.sortOrder },
      create: { slug, name: def.name, icon: def.icon, sortOrder: def.sortOrder },
    });
    catMap[slug] = cat.id;
  }

  for (const r of rawResources) {
    const categoryId = catMap[r.categorySlug] || null;
    await prisma.premiumResource.upsert({
      where: { slug: r.slug },
      update: {
        title: r.title,
        description: r.description,
        categorySlug: r.categorySlug,
        categoryId,
        accessLevel: r.accessLevel || "PREMIUM",
        level: r.level || "Advanced",
        badge: r.badge || "PREMIUM",
        iconName: r.iconName || "Sparkles",
        estimatedHours: r.estimatedHours || 30,
        topicsCount: r.topicsCount || (r.content?.modules?.length || 0),
        externalUrl: r.externalUrl || null,
        content: r.content || {},
        isActive: true,
        isFeatured: r.isFeatured || false,
        sortOrder: r.sortOrder || 0,
      },
      create: {
        slug: r.slug,
        title: r.title,
        description: r.description,
        categorySlug: r.categorySlug,
        categoryId,
        accessLevel: r.accessLevel || "PREMIUM",
        level: r.level || "Advanced",
        badge: r.badge || "PREMIUM",
        iconName: r.iconName || "Sparkles",
        estimatedHours: r.estimatedHours || 30,
        topicsCount: r.topicsCount || (r.content?.modules?.length || 0),
        externalUrl: r.externalUrl || null,
        content: r.content || {},
        isActive: true,
        isFeatured: r.isFeatured || false,
        sortOrder: r.sortOrder || 0,
      },
    });
  }

  console.log(`   └─ ✅ Premium resources seeded (${rawResources.length} curriculums).`);
}

// ==========================================
// 5. ROADMAPS, PHASES, TASKS & PROGRESS
// ==========================================
async function seedRoadmaps(userMap) {
  console.log("\n🗺️ [5/11] Seeding Roadmaps, Roadmap Phases, Tasks & User Roadmap Progress...");

  const admin = userMap["admin@flowctrl.dev"];
  const alex = userMap["alex@flowctrl.dev"];
  const elena = userMap["free.dev@flowctrl.dev"];

  // 5.1 Primary Curated Roadmaps
  const roadmapConfigs = [
    {
      id: "rdm_fullstack_distributed",
      title: "Full-Stack Distributed Systems Engineering",
      slug: "full-stack-distributed-systems",
      category: "role",
      isPublic: true,
      userId: admin.id,
      phases: [
        {
          title: "Phase 1: High-Performance API Protocols",
          order: 1,
          tasks: [
            { title: "RESTful Idempotency & ETag Validation", order: 1, completed: true },
            { title: "gRPC & Protocol Buffers in Node.js", order: 2, completed: true },
            { title: "Distributed WebSockets & Session Sticky Routing", order: 3, completed: false },
          ],
        },
        {
          title: "Phase 2: Database Concurrency & ACID Integrity",
          order: 2,
          tasks: [
            { title: "PostgreSQL Isolation Levels & Row Locking", order: 1, completed: true },
            { title: "Prisma Interactive Transactions & Deadlock Handling", order: 2, completed: false },
            { title: "Read Replicas & Connection Pooling with PgBouncer", order: 3, completed: false },
          ],
        },
        {
          title: "Phase 3: Resilient Architecture & SRE",
          order: 3,
          tasks: [
            { title: "Circuit Breakers & Exponential Backoff Strategies", order: 1, completed: false },
            { title: "Distributed Tracing with OpenTelemetry", order: 2, completed: false },
          ],
        },
      ],
    },
    {
      id: "rdm_cloud_platform_mastery",
      title: "Cloud Native Platform & Kubernetes Mastery",
      slug: "cloud-native-platform-mastery",
      category: "skill",
      isPublic: true,
      userId: alex.id,
      phases: [
        {
          title: "Phase 1: Container Security & Multi-Stage Builds",
          order: 1,
          tasks: [
            { title: "Distroless Docker Containerization", order: 1, completed: true },
            { title: "Image Vulnerability Scanning with Trivy", order: 2, completed: true },
          ],
        },
        {
          title: "Phase 2: Kubernetes Workload Governance",
          order: 2,
          tasks: [
            { title: "Deployments, StatefulSets & Service Meshes", order: 1, completed: false },
            { title: "ConfigMaps, SealedSecrets & HashiCorp Vault", order: 2, completed: false },
          ],
        },
      ],
    },
  ];

  for (const r of roadmapConfigs) {
    let roadmap = await prisma.roadmap.findUnique({
      where: { id: r.id },
      include: { phases: { include: { tasks: true } } },
    });

    if (!roadmap) {
      roadmap = await prisma.roadmap.create({
        data: {
          id: r.id,
          title: r.title,
          slug: r.slug,
          category: r.category,
          isPublic: r.isPublic,
          userId: r.userId,
        },
      });

      for (const p of r.phases) {
        const createdPhase = await prisma.roadmapPhase.create({
          data: {
            title: p.title,
            order: p.order,
            roadmapId: roadmap.id,
          },
        });

        for (const t of p.tasks) {
          await prisma.roadmapTask.create({
            data: {
              title: t.title,
              order: t.order,
              completed: t.completed,
              roadmapPhaseId: createdPhase.id,
            },
          });
        }
      }
    }
  }

  // 5.2 User Roadmap Progress
  if (alex) {
    await prisma.userRoadmapProgress.upsert({
      where: { userId_roadmapSlug: { userId: alex.id, roadmapSlug: "full-stack-distributed-systems" } },
      update: { progressPercent: 65, completedTopics: ["RESTful Idempotency", "gRPC Buffers", "PostgreSQL Isolation"] },
      create: {
        userId: alex.id,
        roadmapSlug: "full-stack-distributed-systems",
        progressPercent: 65,
        completedTopics: ["RESTful Idempotency", "gRPC Buffers", "PostgreSQL Isolation"],
        currentTopic: "Prisma Interactive Transactions",
      },
    });
  }

  if (elena) {
    await prisma.userRoadmapProgress.upsert({
      where: { userId_roadmapSlug: { userId: elena.id, roadmapSlug: "full-stack-distributed-systems" } },
      update: { progressPercent: 20, completedTopics: ["RESTful Idempotency"] },
      create: {
        userId: elena.id,
        roadmapSlug: "full-stack-distributed-systems",
        progressPercent: 20,
        completedTopics: ["RESTful Idempotency"],
        currentTopic: "gRPC & Protocol Buffers",
      },
    });
  }

  console.log(`   └─ ✅ Roadmaps, phases, tasks, and user progress verified.`);
}

// ==========================================
// 6. RESUMES & ATS ANALYSES
// ==========================================
async function seedResumes(userMap) {
  console.log("\n📄 [6/11] Seeding Resumes & AI ATS Analysis Scores...");

  const alex = userMap["alex@flowctrl.dev"];
  const elena = userMap["free.dev@flowctrl.dev"];

  const alexResume = await prisma.resume.upsert({
    where: { id: "res_alex_senior_fullstack" },
    update: {},
    create: {
      id: "res_alex_senior_fullstack",
      userId: alex ? alex.id : null,
      fileName: "Alex_Johnson_Staff_Architect_Resume_2026.pdf",
      fileSize: 148200,
      fileUrl: "https://storage.flowctrl.dev/resumes/alex_senior_fullstack.pdf",
      mimeType: "application/pdf",
    },
  });

  await prisma.resumeAnalysis.upsert({
    where: { id: "analysis_alex_senior_fullstack" },
    update: { overallScore: 94, atsScore: 92 },
    create: {
      id: "analysis_alex_senior_fullstack",
      resumeId: alexResume.id,
      userId: alex ? alex.id : null,
      overallScore: 94,
      verdict: "EXCEPTIONAL",
      verdictReason: "Comprehensive architectural achievements quantified with business metrics and modern distributed tech stack.",
      atsScore: 92,
      atsIssues: ["Minor: Add certification dates for AWS Solutions Architect."],
      topFixes: ["Highlight high-throughput benchmarks in executive summary."],
      strengths: ["PostgreSQL query optimization", "Kubernetes cluster operations", "Microservice resiliency"],
      flaws: [],
      sectionFeedback: { experience: "Strong impact verbs and metrics.", skills: "Aligned with current senior market requirements." },
    },
  });

  if (elena) {
    const elenaResume = await prisma.resume.upsert({
      where: { id: "res_elena_frontend_engineer" },
      update: {},
      create: {
        id: "res_elena_frontend_engineer",
        userId: elena.id,
        fileName: "Elena_Rostova_Frontend_Resume.pdf",
        fileSize: 112400,
        fileUrl: "https://storage.flowctrl.dev/resumes/elena_frontend.pdf",
        mimeType: "application/pdf",
      },
    });

    await prisma.resumeAnalysis.upsert({
      where: { id: "analysis_elena_frontend" },
      update: { overallScore: 82, atsScore: 84 },
      create: {
        id: "analysis_elena_frontend",
        resumeId: elenaResume.id,
        userId: elena.id,
        overallScore: 82,
        verdict: "STRONG",
        verdictReason: "Solid React and TypeScript portfolio. Include quantified performance improvement percentages.",
        atsScore: 84,
        strengths: ["Modern React 19 standards", "Accessibility WCAG compliance"],
        flaws: ["Lacks CI/CD pipeline automation examples"],
      },
    });
  }

  console.log(`   └─ ✅ Resumes and ATS analysis reports verified.`);
  return { alexResume };
}

// ==========================================
// 7. COMPANIES, JOBS, SKILLS & APPLICATIONS
// ==========================================
async function seedCompaniesAndJobs(userMap, resumeRefs, skillMap) {
  console.log("\n🏢 [7/11] Seeding Companies, Job Postings, Job Skills, Saved Jobs & Applications...");

  const alex = userMap["alex@flowctrl.dev"];
  const devin = userMap["expired.member@flowctrl.dev"];

  // 7.1 Companies
  const companies = [
    {
      id: "comp_novascale",
      name: "NovaScale Cloud Systems",
      location: "San Francisco, CA (Remote Friendly)",
      website: "https://novascale.example.com",
      description: "Pioneering distributed serverless data processing and edge compute platforms.",
      isVerified: true,
    },
    {
      id: "comp_synthetix",
      name: "Synthetix AI Laboratories",
      location: "New York, NY (Hybrid)",
      website: "https://synthetix.example.com",
      description: "Building production RAG infrastructure and autonomous enterprise AI agents.",
      isVerified: true,
    },
    {
      id: "comp_apexfintech",
      name: "Apex Global Financial",
      location: "Austin, TX (Remote)",
      website: "https://apexfintech.example.com",
      description: "Low-latency algorithmic transaction clearing and real-time ledger accounting.",
      isVerified: true,
    },
  ];

  const compMap = {};
  for (const c of companies) {
    const rec = await prisma.company.upsert({
      where: { name: c.name },
      update: { location: c.location, description: c.description, isVerified: c.isVerified },
      create: c,
    });
    compMap[c.id] = rec.id;
  }

  // 7.2 Job Postings
  const jobs = [
    {
      id: "job_staff_backend",
      title: "Staff Distributed Systems Engineer",
      companyId: compMap["comp_novascale"],
      location: "San Francisco, CA",
      workMode: "REMOTE",
      salaryMin: 185000,
      salaryMax: 240000,
      currency: "USD",
      isFeatured: true,
      isActive: true,
      description: "Architect and scale our multi-region event streaming fabric processing 5M+ ops/sec.",
      skills: ["TypeScript", "Node.js", "PostgreSQL", "Docker", "Kubernetes"],
    },
    {
      id: "job_ai_systems_lead",
      title: "Lead AI & RAG Infrastructure Engineer",
      companyId: compMap["comp_synthetix"],
      location: "New York, NY",
      workMode: "HYBRID",
      salaryMin: 195000,
      salaryMax: 260000,
      currency: "USD",
      isFeatured: true,
      isActive: true,
      description: "Scale high-performance vector retrieval engines, fine-tune open-weights models, and optimize inference latencies.",
      skills: ["Python", "Vector Embeddings", "PostgreSQL", "Docker"],
    },
    {
      id: "job_senior_cloud_sre",
      title: "Senior Site Reliability Engineer (Cloud)",
      companyId: compMap["comp_apexfintech"],
      location: "Austin, TX",
      workMode: "REMOTE",
      salaryMin: 160000,
      salaryMax: 205000,
      currency: "USD",
      isFeatured: false,
      isActive: true,
      description: "Manage zero-downtime multi-cluster Kubernetes deployments, automated failovers, and security compliance.",
      skills: ["Kubernetes", "Docker", "OWASP Hardening"],
    },
  ];

  for (const j of jobs) {
    const jobRec = await prisma.job.upsert({
      where: { id: j.id },
      update: {
        title: j.title,
        salaryMin: j.salaryMin,
        salaryMax: j.salaryMax,
        isFeatured: j.isFeatured,
        isActive: j.isActive,
      },
      create: {
        id: j.id,
        title: j.title,
        companyId: j.companyId,
        location: j.location,
        workMode: j.workMode,
        salaryMin: j.salaryMin,
        salaryMax: j.salaryMax,
        currency: j.currency,
        isFeatured: j.isFeatured,
        isActive: j.isActive,
        description: j.description,
      },
    });

    // Link Job Skills
    for (const skName of j.skills) {
      if (skillMap[skName]) {
        await prisma.jobSkill.upsert({
          where: { jobId_skillId: { jobId: jobRec.id, skillId: skillMap[skName] } },
          update: { isRequired: true },
          create: { jobId: jobRec.id, skillId: skillMap[skName], isRequired: true },
        });
      }
    }
  }

  // 7.3 Saved Jobs
  if (alex) {
    await prisma.savedJob.upsert({
      where: { userId_jobId: { userId: alex.id, jobId: "job_staff_backend" } },
      update: {},
      create: { userId: alex.id, jobId: "job_staff_backend" },
    });
  }

  // 7.4 Job Applications
  if (alex && resumeRefs.alexResume) {
    const existingApp = await prisma.jobApplication.findFirst({
      where: { userId: alex.id, jobId: "job_staff_backend" },
    });
    if (!existingApp) {
      await prisma.jobApplication.create({
        data: {
          id: "app_alex_staff_backend",
          userId: alex.id,
          jobId: "job_staff_backend",
          resumeId: resumeRefs.alexResume.id,
          status: "INTERVIEWING",
          notes: "Screening passed with hiring manager. System design round scheduled.",
        },
      });
    }
  }

  if (devin) {
    const existingDevinApp = await prisma.jobApplication.findFirst({
      where: { userId: devin.id, jobId: "job_senior_cloud_sre" },
    });
    if (!existingDevinApp) {
      await prisma.jobApplication.create({
        data: {
          id: "app_devin_cloud_sre",
          userId: devin.id,
          jobId: "job_senior_cloud_sre",
          status: "APPLIED",
          notes: "Applied via flowCTRL 1-click platform referral.",
        },
      });
    }
  }

  console.log(`   └─ ✅ Companies, job postings, skills, saved jobs, and applications verified.`);
}

// ==========================================
// 8. MENTOR PROFILES
// ==========================================
async function seedMentors(userMap) {
  console.log("\n🎓 [8/11] Seeding Mentor Profiles with Decimal Hourly Rates...");

  const mentorUser = userMap["mentor@flowctrl.dev"];
  if (mentorUser) {
    await prisma.mentorProfile.upsert({
      where: { userId: mentorUser.id },
      update: {
        expertise: "Distributed Systems, AI Platforms & Cloud Architecture",
        yearsOfExp: 11,
        hourlyRate: 120.00,
        isAvailable: true,
      },
      create: {
        id: "mentor_sarah_lin",
        userId: mentorUser.id,
        expertise: "Distributed Systems, AI Platforms & Cloud Architecture",
        yearsOfExp: 11,
        hourlyRate: 120.00,
        isAvailable: true,
      },
    });
    console.log(`   └─ ✅ Seeded mentor profile: Sarah Lin ($120.00/hr, 11 years exp).`);
  }
}

// ==========================================
// 9. PROJECTS, MEMBERS & ISSUES
// ==========================================
async function seedProjects(userMap) {
  console.log("\n🚀 [9/11] Seeding Collaborative Projects, Memberships & Issue Boards...");

  const projectsPath = path.join(SEEDS_DIR, "projects.seed.json");
  const rawProjects = JSON.parse(fs.readFileSync(projectsPath, "utf-8"));

  for (const p of rawProjects) {
    let ownerId = null;
    if (p.ownerEmail && userMap[p.ownerEmail]) {
      ownerId = userMap[p.ownerEmail].id;
    }

    const project = await prisma.project.upsert({
      where: { id: p.id },
      update: {
        title: p.title,
        category: p.category || "General",
        difficulty: p.difficulty || "Intermediate",
        techStack: p.techStack || [],
        githubUrl: p.githubUrl || null,
        isPinned: p.isPinned || false,
        isDemo: p.isDemo || false,
      },
      create: {
        id: p.id,
        title: p.title,
        category: p.category || "General",
        difficulty: p.difficulty || "Intermediate",
        techStack: p.techStack || [],
        description: p.description || null,
        githubUrl: p.githubUrl || null,
        isPinned: p.isPinned || false,
        isDemo: p.isDemo || false,
        ownerId,
      },
    });

    if (ownerId) {
      await prisma.projectMember.upsert({
        where: { projectId_userId: { projectId: project.id, userId: ownerId } },
        update: { projectRole: "owner" },
        create: { projectId: project.id, userId: ownerId, projectRole: "owner" },
      });
    }

    // Add Alex as editor collaborator if not owner
    const alex = userMap["alex@flowctrl.dev"];
    if (alex && alex.id !== ownerId) {
      await prisma.projectMember.upsert({
        where: { projectId_userId: { projectId: project.id, userId: alex.id } },
        update: { projectRole: "editor" },
        create: { projectId: project.id, userId: alex.id, projectRole: "editor" },
      });
    }

    // Seed Issues
    if (Array.isArray(p.issues)) {
      for (const issue of p.issues) {
        await prisma.issue.upsert({
          where: { id: issue.id },
          update: {
            title: issue.title,
            status: issue.status || "TODO",
            priority: issue.priority || "MEDIUM",
          },
          create: {
            id: issue.id,
            title: issue.title,
            description: issue.description || "",
            status: issue.status || "TODO",
            priority: issue.priority || "MEDIUM",
            tags: issue.tags || [],
            projectId: project.id,
            creatorId: ownerId,
            assigneeId: alex ? alex.id : null,
          },
        });
      }
    }
  }

  console.log(`   └─ ✅ Projects, project members, and issue boards verified.`);
}

// ==========================================
// 10. NOTIFICATIONS
// ==========================================
async function seedNotifications(userMap) {
  console.log("\n🔔 [10/11] Seeding User Notifications (Read & Unread States)...");

  const notifications = [
    {
      id: "notif_alex_premium_welcome",
      email: "alex@flowctrl.dev",
      title: "Premium Pro Unlocked",
      message: "Welcome to flowCTRL Pro. Your unrestricted access to advanced curriculums and mentor matching is active.",
      type: "success",
      read: true,
      readAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    {
      id: "notif_alex_job_match",
      email: "alex@flowctrl.dev",
      title: "New Job Match: Staff Distributed Systems Engineer",
      message: "NovaScale Cloud Systems posted a 96% match with your verified skills and ATS resume profile.",
      type: "job",
      read: false,
    },
    {
      id: "notif_devin_expired",
      email: "expired.member@flowctrl.dev",
      title: "Membership Period Expired",
      message: "Your Pro membership subscription ended. Renew anytime to restore access to specialized learning guides.",
      type: "warning",
      read: false,
    },
    {
      id: "notif_elena_milestone",
      email: "free.dev@flowctrl.dev",
      title: "Roadmap Milestone Achieved",
      message: "Great progress! You completed 20% of the Full-Stack Systems roadmap.",
      type: "info",
      read: false,
    },
  ];

  for (const n of notifications) {
    const user = userMap[n.email];
    if (!user) continue;

    await prisma.notification.upsert({
      where: { id: n.id },
      update: { read: n.read, readAt: n.readAt || null },
      create: {
        id: n.id,
        userId: user.id,
        title: n.title,
        message: n.message,
        type: n.type,
        read: n.read,
        readAt: n.readAt || null,
      },
    });
  }

  console.log(`   └─ ✅ Notifications verified (${notifications.length} notifications seeded).`);
}

// ==========================================
// 11. AUDIT LOGS
// ==========================================
async function seedAuditLogs(userMap) {
  console.log("\n🛡️ [11/11] Seeding Audit Logs (Governance & Security Trail)...");

  const admin = userMap["admin@flowctrl.dev"];
  const alex = userMap["alex@flowctrl.dev"];

  const auditEvents = [
    {
      id: "audit_schema_upgrade_20261102",
      userId: admin ? admin.id : null,
      action: "database.schema_migrated",
      targetType: "DatabaseSchema",
      targetId: "migration_20261102_enterprise_db_audit_optimization",
      ipAddress: "127.0.0.1",
      userAgent: "flowCTRL Prisma Engine",
      details: {
        monetaryPrecisionEnforced: ["MembershipPlan.price", "MembershipTransaction.amount", "MentorProfile.hourlyRate"],
        indexesAdded: 10,
        status: "SUCCESS",
      },
    },
    {
      id: "audit_alex_membership_upgrade",
      userId: alex ? alex.id : null,
      action: "membership.upgraded",
      targetType: "UserMembership",
      targetId: "PREMIUM_MONTHLY",
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0 Chrome/128.0",
      details: { planCode: "PREMIUM_MONTHLY", amount: 29.00, tier: "PREMIUM" },
    },
  ];

  for (const a of auditEvents) {
    await prisma.auditLog.upsert({
      where: { id: a.id },
      update: { details: a.details },
      create: {
        id: a.id,
        userId: a.userId,
        action: a.action,
        targetType: a.targetType,
        targetId: a.targetId,
        ipAddress: a.ipAddress,
        userAgent: a.userAgent,
        details: a.details,
      },
    });
  }

  console.log(`   └─ ✅ Audit log entries verified.`);
}

// ==========================================
// MAIN ENTRY POINT
// ==========================================
async function main() {
  console.log("====================================================================");
  console.log("🌱 flowCTRL Enterprise Comprehensive Database Seeding Started");
  console.log("   Standard: Google / Microsoft / Apple Production Engineering");
  console.log("   Environment Safeguard: STRICT DEVELOPMENT ONLY (Idempotent)");
  console.log("====================================================================");

  const { skillMap } = await seedCatalog();
  const userMap = await seedUsers(skillMap);
  await seedMemberships(userMap);
  await seedPremiumResources();
  await seedRoadmaps(userMap);
  const resumeRefs = await seedResumes(userMap);
  await seedCompaniesAndJobs(userMap, resumeRefs, skillMap);
  await seedMentors(userMap);
  await seedProjects(userMap);
  await seedNotifications(userMap);
  await seedAuditLogs(userMap);

  console.log("\n====================================================================");
  console.log("✨ ALL 35 DATABASE MODELS SUCCESSFULLY SEEDED & VERIFIED IDEMPOTENTLY!");
  console.log("====================================================================");
}

main()
  .catch((err) => {
    console.error("\n❌ Database seeding encountered fatal error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
