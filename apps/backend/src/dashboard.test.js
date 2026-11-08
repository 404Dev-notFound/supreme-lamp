const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const dashboardService = require("./services/dashboard.service");
const { prisma } = require("./lib/prisma");

describe("Centralized Database-Driven Dashboard Suite", () => {
  it("1. getAccountDashboard rejects invalid or missing user ID with 401", async () => {
    await assert.rejects(
      async () => {
        await dashboardService.getAccountDashboard(null);
      },
      (err) => {
        assert.equal(err.statusCode, 401);
        assert.equal(err.code, "UNAUTHORIZED");
        return true;
      }
    );
  });

  it("2. getAccountDashboard retrieves real database metrics for seeded user", async () => {
    // Find an existing user or fallback to alex
    const user = await prisma.user.findFirst({
      where: { email: "alex@flowctrl.dev" },
    });

    assert.ok(user, "Seeded user alex@flowctrl.dev must exist in database");

    const result = await dashboardService.getAccountDashboard(user.id);

    // Verify User Account attributes
    assert.equal(result.user.id, user.id);
    assert.equal(result.user.email, user.email);
    assert.equal(result.user.password, undefined, "Password must NEVER be returned");

    // Verify KPI structure
    assert.ok(result.kpis !== undefined);
    assert.equal(typeof result.kpis.careerReadinessScore, "number");
    assert.equal(typeof result.kpis.activeRoadmapsCount, "number");
    assert.equal(typeof result.kpis.tutorialsStartedCount, "number");
    assert.equal(typeof result.kpis.tutorialsCompletedCount, "number");
    assert.equal(typeof result.kpis.bookmarkedProjectsCount, "number");

    // Verify Arrays are present
    assert.ok(Array.isArray(result.enrolledRoadmaps));
    assert.ok(Array.isArray(result.activeTutorials));
    assert.ok(Array.isArray(result.bookmarks));
    assert.ok(Array.isArray(result.recentActivity));
  });

  it("3. Profile-Specific Data Isolation: Account A vs Account B do NOT leak data", async () => {
    const userA = await prisma.user.findFirst({ where: { email: "alex@flowctrl.dev" } });
    const userB = await prisma.user.findFirst({ where: { email: "free.dev@flowctrl.dev" } });

    assert.ok(userA && userB, "Both test users must exist in database");

    const dashA = await dashboardService.getAccountDashboard(userA.id);
    const dashB = await dashboardService.getAccountDashboard(userB.id);

    // Identity check
    assert.equal(dashA.user.id, userA.id);
    assert.equal(dashB.user.id, userB.id);
    assert.notEqual(dashA.user.email, dashB.user.email);

    // Ensure user A's enrolled roadmap items only belong to user A
    for (const rm of dashA.enrolledRoadmaps) {
      const dbRecord = await prisma.userRoadmapProgress.findUnique({
        where: { id: rm.id },
      });
      assert.equal(dbRecord.userId, userA.id, "Roadmap record must strictly belong to user A");
    }

    // Ensure user B's enrolled roadmap items only belong to user B
    for (const rm of dashB.enrolledRoadmaps) {
      const dbRecord = await prisma.userRoadmapProgress.findUnique({
        where: { id: rm.id },
      });
      assert.equal(dbRecord.userId, userB.id, "Roadmap record must strictly belong to user B");
    }
  });

  it("4. Zero-data clean account displays legitimate 0s and empty states", async () => {
    // Upsert a dedicated zero-data test user
    const zeroUser = await prisma.user.upsert({
      where: { email: "clean.tester.zero@flowctrl.io" },
      update: {},
      create: {
        email: "clean.tester.zero@flowctrl.io",
        name: "Zero Data Tester",
        role: "USER",
        status: "ACTIVE",
      },
    });

    const result = await dashboardService.getAccountDashboard(zeroUser.id);

    assert.equal(result.user.id, zeroUser.id);
    assert.equal(result.kpis.careerReadinessScore, 0, "Clean account must have 0% career readiness");
    assert.equal(result.kpis.activeRoadmapsCount, 0);
    assert.equal(result.kpis.completedRoadmapsCount, 0);
    assert.equal(result.kpis.tutorialsStartedCount, 0);
    assert.equal(result.kpis.tutorialsCompletedCount, 0);
    assert.equal(result.kpis.bookmarkedProjectsCount, 0);
    assert.equal(result.enrolledRoadmaps.length, 0);
    assert.equal(result.activeTutorials.length, 0);
    assert.equal(result.bookmarks.length, 0);
    assert.equal(result.recentActivity.length, 0);

    // Clean up test user
    await prisma.user.delete({ where: { id: zeroUser.id } });
  });
});

