const { prisma } = require("../lib/prisma");

class MembershipError extends Error {
  constructor(message, statusCode = 400, code = "MEMBERSHIP_ERROR") {
    super(message);
    this.name = "MembershipError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Fetch all available active membership plans.
 */
async function getPlans() {
  const plans = await prisma.membershipPlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return plans.map((p) => ({
    ...p,
    price: p.price !== null && p.price !== undefined ? Number(p.price) : 0,
  }));
}

/**
 * Fetch and verify a user's membership, automatically checking for expiration.
 */
async function getUserMembership(userId) {
  if (!userId) {
    throw new MembershipError("User ID is required.", 400, "INVALID_USER");
  }

  let membership = await prisma.userMembership.findUnique({
    where: { userId },
    include: { plan: true },
  });

  // If user has no membership record yet, provision default FREE membership
  if (!membership) {
    const freePlan = await prisma.membershipPlan.findUnique({
      where: { code: "FREE" },
    });

    if (freePlan) {
      membership = await prisma.userMembership.create({
        data: {
          userId,
          planId: freePlan.id,
          tier: "FREE",
          status: "ACTIVE",
          expiresAt: null,
          autoRenew: false,
        },
        include: { plan: true },
      });
    }
  }

  // Real-time expiration check
  if (
    membership &&
    membership.tier === "PREMIUM" &&
    membership.status === "ACTIVE" &&
    membership.expiresAt &&
    new Date(membership.expiresAt) < new Date()
  ) {
    // Membership has expired, downgrade atomically
    membership = await prisma.userMembership.update({
      where: { id: membership.id },
      data: {
        status: "EXPIRED",
        lastVerifiedAt: new Date(),
      },
      include: { plan: true },
    });

    await prisma.membershipHistory.create({
      data: {
        userId,
        planId: membership.planId,
        action: "EXPIRED",
        tier: "PREMIUM",
        startDate: membership.startDate,
        endDate: membership.expiresAt,
        note: "Membership expired automatically due to validity period end.",
      },
    });
  }

  const isPremium =
    membership?.tier === "PREMIUM" &&
    membership?.status === "ACTIVE" &&
    (!membership?.expiresAt || new Date(membership.expiresAt) > new Date());

  let daysRemaining = null;
  if (isPremium && membership.expiresAt) {
    const diffMs = new Date(membership.expiresAt) - new Date();
    daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  if (membership?.plan && membership.plan.price !== undefined && membership.plan.price !== null) {
    membership.plan.price = Number(membership.plan.price);
  }

  return {
    membership,
    isPremium,
    tier: isPremium ? "PREMIUM" : "FREE",
    status: membership?.status || "ACTIVE",
    plan: membership?.plan || null,
    expiresAt: membership?.expiresAt || null,
    daysRemaining,
    autoRenew: membership?.autoRenew || false,
    cancelledAt: membership?.cancelledAt || null,
  };
}

/**
 * Upgrade or activate a user's Premium membership with transactional integrity.
 */
async function upgradeMembership({
  userId,
  planCode,
  paymentMethod = "mock",
  autoRenew = true,
  req = null,
}) {
  if (!userId) {
    throw new MembershipError("User ID is required.", 400, "INVALID_USER");
  }

  const targetPlan = await prisma.membershipPlan.findUnique({
    where: { code: planCode },
  });

  if (!targetPlan || !targetPlan.isActive) {
    throw new MembershipError(
      "The requested membership plan is not available.",
      404,
      "PLAN_NOT_FOUND",
    );
  }

  const now = new Date();
  let expiresAt = null;

  if (targetPlan.interval === "month") {
    expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  } else if (targetPlan.interval === "year") {
    expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  }

  const ipAddress =
    req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req?.socket?.remoteAddress ||
    "127.0.0.1";
  const userAgent = req?.headers?.["user-agent"] || "flowCTRL Client";

  // Atomically execute membership upgrade, transaction record, history, and audit log
  const result = await prisma.$transaction(async (tx) => {
    const updatedMembership = await tx.userMembership.upsert({
      where: { userId },
      update: {
        planId: targetPlan.id,
        tier: targetPlan.tier,
        status: "ACTIVE",
        startDate: now,
        expiresAt,
        autoRenew,
        cancelledAt: null,
        lastVerifiedAt: now,
      },
      create: {
        userId,
        planId: targetPlan.id,
        tier: targetPlan.tier,
        status: "ACTIVE",
        startDate: now,
        expiresAt,
        autoRenew,
        lastVerifiedAt: now,
      },
      include: { plan: true },
    });

    const transaction = await tx.membershipTransaction.create({
      data: {
        userId,
        membershipId: updatedMembership.id,
        amount: targetPlan.price,
        currency: targetPlan.currency,
        status: "COMPLETED",
        paymentMethod,
        providerReference: `txn_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      },
    });

    await tx.membershipHistory.create({
      data: {
        userId,
        planId: targetPlan.id,
        action: "UPGRADED",
        tier: targetPlan.tier,
        startDate: now,
        endDate: expiresAt,
        note: `Upgraded to ${targetPlan.name} via ${paymentMethod}`,
      },
    });

    await tx.securityLog.create({
      data: {
        userId,
        eventType: "membership_upgrade",
        ipAddress,
        userAgent,
        details: {
          planCode: targetPlan.code,
          tier: targetPlan.tier,
          transactionId: transaction.id,
          amount: targetPlan.price,
        },
      },
    });

    if (updatedMembership?.plan && updatedMembership.plan.price !== undefined && updatedMembership.plan.price !== null) {
      updatedMembership.plan.price = Number(updatedMembership.plan.price);
    }

    return updatedMembership;
  });

  return {
    success: true,
    message: `Congratulations! You have unlocked ${targetPlan.name}.`,
    membership: result,
    isPremium: true,
  };
}

/**
 * Cancel a user's auto-renewing Premium membership.
 */
async function cancelMembership({ userId, reason = "", req = null }) {
  if (!userId) {
    throw new MembershipError("User ID is required.", 400, "INVALID_USER");
  }

  const membership = await prisma.userMembership.findUnique({
    where: { userId },
    include: { plan: true },
  });

  if (!membership || membership.tier !== "PREMIUM") {
    throw new MembershipError(
      "No active premium membership found to cancel.",
      400,
      "NO_PREMIUM_MEMBERSHIP",
    );
  }

  const ipAddress =
    req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req?.socket?.remoteAddress ||
    "127.0.0.1";
  const userAgent = req?.headers?.["user-agent"] || "flowCTRL Client";

  const updated = await prisma.$transaction(async (tx) => {
    const m = await tx.userMembership.update({
      where: { userId },
      data: {
        autoRenew: false,
        cancelledAt: new Date(),
      },
      include: { plan: true },
    });

    await tx.membershipHistory.create({
      data: {
        userId,
        planId: m.planId,
        action: "CANCELLED",
        tier: m.tier,
        startDate: m.startDate,
        endDate: m.expiresAt,
        note: reason || "User cancelled auto-renewal. Access remains active until period ends.",
      },
    });

    await tx.securityLog.create({
      data: {
        userId,
        eventType: "membership_cancelled",
        ipAddress,
        userAgent,
        details: { reason },
      },
    });

    return m;
  });

  return {
    success: true,
    message: "Auto-renewal cancelled. You will retain Premium access until your current period ends.",
    membership: updated,
  };
}

/**
 * Get membership history and transactions for a user.
 */
async function getMembershipHistory(userId) {
  if (!userId) {
    throw new MembershipError("User ID is required.", 400, "INVALID_USER");
  }

  const [history, transactions] = await Promise.all([
    prisma.membershipHistory.findMany({
      where: { userId },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.membershipTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { history, transactions };
}

module.exports = {
  MembershipError,
  getPlans,
  getUserMembership,
  upgradeMembership,
  cancelMembership,
  getMembershipHistory,
};

