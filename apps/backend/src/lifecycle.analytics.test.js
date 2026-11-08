const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { prisma } = require("./lib/prisma");
const { analyticsService } = require("./services/analytics.service");
const authService = require("./services/auth.service");
const roadmapProgressService = require("./services/roadmapProgress.service");
const dashboardService = require("./services/dashboard.service");

describe("Complete User Lifecycle, Persistence & Analytics Engine Suite", () => {
  const testEmail = `lifecycle.test.${Date.now()}@flowctrl.dev`;
  let testUser = null;

  it("1. User Registration: Creates unique permanent user ID, profile, preferences, and activity log", async () => {
    // Perform signup
    const result = await authService.signup({
      name: "Lifecycle Tester",
      email: testEmail,
      password: "StrongPassword123!",
    });

    assert.ok(result.user, "User must be created");
    assert.ok(result.user.id, "Permanent database ID must be assigned");
    assert.equal(result.user.email, testEmail);

    testUser = result.user;

    // Verify UserProfile was created
    const profile = await prisma.userProfile.findUnique({
      where: { userId: testUser.id },
    });
    assert.ok(profile, "UserProfile must be linked to user ID");

    // Verify UserPreference was created
    const pref = await prisma.userPreference.findUnique({
      where: { userId: testUser.id },
    });
    assert.ok(pref, "UserPreference must be linked to user ID");

    // Verify UserActivityLog has REGISTER event
    const regActivity = await prisma.userActivityLog.findFirst({
      where: { userId: testUser.id, activityType: "REGISTER" },
    });
    assert.ok(regActivity, "UserActivityLog must capture account registration");
    assert.equal(regActivity.userId, testUser.id);
  });

  it("2. Sign-in & Sign-out Activity Tracking in PostgreSQL", async () => {
    assert.ok(testUser, "Test user must exist");

    // Sign in
    const signInResult = await authService.signin({
      email: testEmail,
      password: "StrongPassword123!",
    });
    assert.ok(signInResult.sessionToken, "Session token must be generated");

    // Verify login activity logged
    const loginActivity = await prisma.userActivityLog.findFirst({
      where: { userId: testUser.id, activityType: "SIGN_IN" },
    });
    assert.ok(loginActivity, "SIGN_IN activity must be recorded in database");

    // Sign out
    await authService.logout(signInResult.sessionToken);

    // Verify logout activity logged
    const logoutActivity = await prisma.userActivityLog.findFirst({
      where: { userId: testUser.id, activityType: "SIGN_OUT" },
    });
    assert.ok(logoutActivity, "SIGN_OUT activity must be recorded in database");
  });

  it("3. Roadmap Analytics: Distinguishes page views from enrollments", async () => {
    const slug = "test-roadmap-analytics-" + Date.now();
    const visitorA = "v_test_anon_1_" + Date.now();
    const visitorB = "v_test_anon_2_" + Date.now();

    // 1. Visitor A views roadmap detail
    const viewRes1 = await analyticsService.recordEvent({
      visitorId: visitorA,
      eventType: "DETAIL_VIEW",
      entityType: "ROADMAP",
      entityId: slug,
    });
    assert.equal(viewRes1.recorded, true);

    // 2. Visitor A views it again (should NOT count as enrollment, should dedupe or count total views)
    await analyticsService.recordEvent({
      visitorId: visitorB,
      eventType: "DETAIL_VIEW",
      entityType: "ROADMAP",
      entityId: slug,
    });

    const statsAfterViews = await analyticsService.getEntityAnalytics({
      entityType: "ROADMAP",
      entityId: slug,
    });

    assert.equal(statsAfterViews.totalViews >= 2, true, "Total views should be >= 2");
    assert.equal(statsAfterViews.totalEnrollments, 0, "A view must NEVER be counted as an enrollment");

    // 3. Authenticated user enrolls in roadmap
    await roadmapProgressService.enrollInTrack({
      userId: testUser.id,
      roadmapSlug: slug,
    });

    const statsAfterEnroll = await analyticsService.getEntityAnalytics({
      entityType: "ROADMAP",
      entityId: slug,
    });

    assert.equal(statsAfterEnroll.totalEnrollments >= 1, true, "Enrollment count must increment");
    assert.equal(statsAfterEnroll.activeLearners >= 1, true, "Active learners must increment");

    // Verify user activity log has ROADMAP_ENROLL
    const enrollLog = await prisma.userActivityLog.findFirst({
      where: { userId: testUser.id, activityType: "ROADMAP_ENROLL", entityId: slug },
    });
    assert.ok(enrollLog, "ROADMAP_ENROLL must be persisted in UserActivityLog");
  });

  it("4. DSA Problem Solving Persistence & Analytics Tracking", async () => {
    const problemSlug = "two-sum-test-" + Date.now();

    // Solve problem
    const solvedRecord = await prisma.userDsaProgress.create({
      data: {
        userId: testUser.id,
        problemSlug,
        language: "python",
        isSolved: true,
        solvedAt: new Date(),
      },
    });

    assert.equal(solvedRecord.userId, testUser.id);
    assert.equal(solvedRecord.isSolved, true);

    // Record DSA solve event
    await analyticsService.recordEvent({
      userId: testUser.id,
      eventType: "SOLVE",
      entityType: "DSA",
      entityId: problemSlug,
    });

    // Verify activity log
    const dsaLog = await prisma.userActivityLog.findFirst({
      where: { userId: testUser.id, activityType: "DSA_SOLVED", entityId: problemSlug },
    });
    assert.ok(dsaLog, "DSA_SOLVED must be recorded in UserActivityLog");
  });

  it("5. Resource Bookmarks Persistence & Ownership", async () => {
    // Pick an existing resource
    const res = await prisma.premiumResource.findFirst();
    if (res) {
      const bookmark = await prisma.resourceBookmark.create({
        data: {
          userId: testUser.id,
          resourceId: res.id,
        },
      });

      assert.equal(bookmark.userId, testUser.id);

      // Verify Dashboard picks up saved resource
      const dash = await dashboardService.getAccountDashboard(testUser.id);
      assert.ok(dash.kpis.bookmarkedResourcesCount >= 1);
    }
  });

  it("6. Admin Platform Analytics: Role-Based Access Control and Metrics", async () => {
    // Regular user role must be rejected
    await assert.rejects(
      async () => {
        await analyticsService.getPlatformOverview("USER");
      },
      /Unauthorized/
    );

    // ADMIN role gets full platform report
    const report = await analyticsService.getPlatformOverview("ADMIN");
    assert.ok(report.metrics);
    assert.equal(typeof report.metrics.totalRegisteredUsers, "number");
    assert.ok(report.metrics.totalRegisteredUsers >= 1);
    assert.ok(Array.isArray(report.topRoadmapsByViews));
    assert.ok(Array.isArray(report.topRoadmapsByEnrollments));
  });

  it("7. Cleanup Test Data", async () => {
    if (testUser) {
      await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
    }
  });
});
