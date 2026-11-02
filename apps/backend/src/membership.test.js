const test = require("node:test");
const assert = require("node:assert/strict");
const { prisma } = require("./lib/prisma");
const membershipService = require("./services/membership.service");
const premiumResourcesService = require("./services/premiumResources.service");
const { validateUpgrade } = require("./validators/membership.validator");
const { requirePremium } = require("./middleware/membership.middleware");

test("Membership Validator - Validates upgrade plans and payloads", () => {
  const validMonthly = validateUpgrade({ planCode: "PREMIUM_MONTHLY" });
  assert.equal(validMonthly.isValid, true);
  assert.equal(validMonthly.sanitized.planCode, "PREMIUM_MONTHLY");

  const validAnnual = validateUpgrade({
    planCode: "premium_annual",
    paymentMethod: "card",
  });
  assert.equal(validAnnual.isValid, true);
  assert.equal(validAnnual.sanitized.planCode, "PREMIUM_ANNUAL");

  const invalidPlan = validateUpgrade({ planCode: "ULTIMATE_SUPER_PLAN" });
  assert.equal(invalidPlan.isValid, false);
  assert.ok(invalidPlan.errors.length > 0);

  const missingPlan = validateUpgrade({});
  assert.equal(missingPlan.isValid, false);
});

test("Membership Service - Lists available active plans with Free and Premium tiers", async () => {
  const plans = await membershipService.getPlans();
  assert.ok(Array.isArray(plans));
  assert.ok(plans.length >= 2, "Expected at least 2 active plans");

  const freePlan = plans.find((p) => p.code === "FREE");
  assert.ok(freePlan, "FREE plan should exist in database");
  assert.equal(freePlan.tier, "FREE");
  assert.equal(freePlan.price, 0);

  const premiumMonthly = plans.find((p) => p.code === "PREMIUM_MONTHLY");
  assert.ok(premiumMonthly, "PREMIUM_MONTHLY plan should exist");
  assert.equal(premiumMonthly.tier, "PREMIUM");
  assert.ok(premiumMonthly.price > 0);
});

test("Membership Service - Verifies user tier and real-time expiration", async () => {
  // Test with seeded admin user (PREMIUM)
  const admin = await prisma.user.findUnique({
    where: { email: "admin@flowctrl.dev" },
  });
  assert.ok(admin, "Seeded admin user should exist");

  const adminStatus = await membershipService.getUserMembership(admin.id);
  assert.equal(adminStatus.isPremium, true);
  assert.equal(adminStatus.tier, "PREMIUM");
  assert.equal(adminStatus.status, "ACTIVE");

  // Test with seeded mentor user (FREE)
  const mentor = await prisma.user.findUnique({
    where: { email: "mentor@flowctrl.dev" },
  });
  assert.ok(mentor, "Seeded mentor user should exist");

  const mentorStatus = await membershipService.getUserMembership(mentor.id);
  assert.equal(mentorStatus.isPremium, false);
  assert.equal(mentorStatus.tier, "FREE");
});

test("Membership Service - Upgrades free user to Premium with atomic persistence", async () => {
  const mentor = await prisma.user.findUnique({
    where: { email: "mentor@flowctrl.dev" },
  });
  assert.ok(mentor);

  const upgradeRes = await membershipService.upgradeMembership({
    userId: mentor.id,
    planCode: "PREMIUM_MONTHLY",
    paymentMethod: "mock",
    autoRenew: true,
  });

  assert.equal(upgradeRes.success, true);
  assert.equal(upgradeRes.isPremium, true);

  // Read back directly from PostgreSQL to verify persistence
  const verified = await membershipService.getUserMembership(mentor.id);
  assert.equal(verified.isPremium, true);
  assert.equal(verified.tier, "PREMIUM");
  assert.equal(verified.status, "ACTIVE");
  assert.ok(verified.expiresAt);
  assert.ok(verified.daysRemaining > 0);

  // Verify transaction record created
  const history = await membershipService.getMembershipHistory(mentor.id);
  assert.ok(history.transactions.length > 0);
  assert.ok(history.history.some((h) => h.action === "UPGRADED"));

  // Revert back to FREE for ongoing test isolation
  const freePlan = await prisma.membershipPlan.findUnique({ where: { code: "FREE" } });
  await prisma.userMembership.update({
    where: { userId: mentor.id },
    data: {
      planId: freePlan.id,
      tier: "FREE",
      status: "ACTIVE",
      expiresAt: null,
      autoRenew: false,
    },
  });
});

test("Membership Service - Cancels auto-renewal while keeping validity period", async () => {
  const alex = await prisma.user.findUnique({
    where: { email: "alex@flowctrl.dev" },
  });
  assert.ok(alex);

  const cancelRes = await membershipService.cancelMembership({
    userId: alex.id,
    reason: "Testing cancellation flow",
  });

  assert.equal(cancelRes.success, true);
  assert.equal(cancelRes.membership.autoRenew, false);
});

test("Premium Resources Service - Strips confidential curriculum for non-premium viewers", async () => {
  // Non-premium viewer
  const freeList = await premiumResourcesService.listResources({
    isPremium: false,
  });
  assert.ok(freeList.length > 0);
  for (const item of freeList) {
    assert.equal(item.isLocked, true);
    assert.equal(item.content, undefined, "Content must NOT leak to non-premium viewers");
    assert.ok(Array.isArray(item.moduleOutlines));
  }

  // Premium viewer
  const premiumList = await premiumResourcesService.listResources({
    isPremium: true,
  });
  assert.ok(premiumList.length > 0);
  const firstItem = premiumList[0];
  assert.equal(firstItem.isLocked, false);
  assert.ok(firstItem.content, "Content MUST be present for premium viewers");
  assert.ok(firstItem.content.modules);
});

test("Premium Resources Service - Single resource lookup respects entitlement", async () => {
  const slug = "distributed-systems-architecture";

  // Free/Locked lookup
  const lockedRes = await premiumResourcesService.getResourceBySlug(slug, {
    isPremium: false,
  });
  assert.equal(lockedRes.isLocked, true);
  assert.equal(lockedRes.content, undefined);
  assert.ok(lockedRes.preview);
  assert.ok(lockedRes.preview.overview);

  // Unlocked lookup
  const unlockedRes = await premiumResourcesService.getResourceBySlug(slug, {
    isPremium: true,
  });
  assert.equal(unlockedRes.isLocked, false);
  assert.ok(unlockedRes.content);
  assert.ok(unlockedRes.content.modules.length > 0);
});

test("requirePremium Middleware - Rejects unauthenticated and non-premium requests", async () => {
  // 1. Unauthenticated request
  const reqUnauth = { headers: {} };
  let statusCodeUnauth = null;
  let jsonBodyUnauth = null;
  const resUnauth = {
    status(code) {
      statusCodeUnauth = code;
      return this;
    },
    json(body) {
      jsonBodyUnauth = body;
      return this;
    },
  };

  await requirePremium(reqUnauth, resUnauth, () => {});
  assert.equal(statusCodeUnauth, 401);
  assert.equal(jsonBodyUnauth.code, "UNAUTHORIZED");

  // 2. Authenticated Free User
  const mentor = await prisma.user.findUnique({
    where: { email: "mentor@flowctrl.dev" },
  });
  const reqFree = {
    user: { id: mentor.id, email: mentor.email, role: mentor.role },
  };
  let statusCodeFree = null;
  let jsonBodyFree = null;
  const resFree = {
    status(code) {
      statusCodeFree = code;
      return this;
    },
    json(body) {
      jsonBodyFree = body;
      return this;
    },
  };

  await requirePremium(reqFree, resFree, () => {});
  assert.equal(statusCodeFree, 403);
  assert.equal(jsonBodyFree.code, "PREMIUM_REQUIRED");
  assert.equal(jsonBodyFree.isLocked, true);

  // 3. Authenticated Premium User
  const admin = await prisma.user.findUnique({
    where: { email: "admin@flowctrl.dev" },
  });
  const reqPrem = {
    user: { id: admin.id, email: admin.email, role: admin.role },
  };
  let calledNext = false;
  await requirePremium(reqPrem, {}, () => {
    calledNext = true;
  });
  assert.equal(calledNext, true);
});

