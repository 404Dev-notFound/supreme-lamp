const { prisma } = require("../lib/prisma");
const { recordAuditLog } = require("./audit.service");
const { cache, buildKey, REDIS_CONFIG } = require("../lib/redis");

class AdminError extends Error {
  constructor(message, statusCode = 400, code = "ADMIN_ERROR") {
    super(message);
    this.name = "AdminError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * List platform users with search, role/status filtering, and pagination
 */
async function listUsers({
  page = 1,
  limit = 20,
  search = "",
  role = null,
  status = null,
}) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (safePage - 1) * safeLimit;

  const where = {};
  if (role) where.role = role;
  if (status) where.status = status;

  if (search && typeof search === "string" && search.trim()) {
    const q = search.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            displayName: true,
            headline: true,
            location: true,
          },
        },
        _count: {
          select: {
            ownedProjects: true,
            jobApplications: true,
            resumes: true,
          },
        },
      },
    }),
  ]);

  return {
    users,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}

/**
 * Update user role with strict privilege escalation defense
 */
async function updateUserRole({
  targetUserId,
  newRole,
  currentAdminId,
  currentAdminRole,
  req = null,
}) {
  if (targetUserId === currentAdminId) {
    throw new AdminError("Administrators cannot modify their own role.", 400, "CANNOT_MODIFY_SELF");
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!targetUser) {
    throw new AdminError("Target user not found.", 404, "USER_NOT_FOUND");
  }

  if (!["USER", "ADMIN"].includes(newRole)) {
    throw new AdminError("Invalid role. Role must be USER or ADMIN.", 400, "INVALID_ROLE");
  }

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: { role: newRole },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });

  await recordAuditLog({
    userId: currentAdminId,
    action: "ADMIN_ROLE_UPDATED",
    targetType: "User",
    targetId: targetUserId,
    details: { previousRole: targetUser.role, newRole },
    req,
  });

  return updated;
}

/**
 * Update user account status (Suspend / Reactivate)
 */
async function updateUserStatus({
  targetUserId,
  newStatus,
  reason = "",
  currentAdminId,
  currentAdminRole,
  req = null,
}) {
  if (targetUserId === currentAdminId) {
    throw new AdminError("Administrators cannot suspend their own account.", 400, "CANNOT_SUSPEND_SELF");
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!targetUser) {
    throw new AdminError("Target user not found.", 404, "USER_NOT_FOUND");
  }


  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.user.update({
      where: { id: targetUserId },
      data: { status: newStatus },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    // If suspended or deactivated, revoke all active sessions immediately
    if (newStatus !== "ACTIVE") {
      await tx.userSession.updateMany({
        where: { userId: targetUserId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    return u;
  });

  await recordAuditLog({
    userId: currentAdminId,
    action: "ADMIN_STATUS_UPDATED",
    targetType: "User",
    targetId: targetUserId,
    details: { previousStatus: targetUser.status, newStatus, reason },
    req,
  });

  return updated;
}

/**
 * Get platform-wide statistics for Mission Control / Admin Dashboard
 */
async function getPlatformStats() {
  const cacheKey = buildKey(REDIS_CONFIG.namespaces.STATS, "platform", "aggregate");

  return cache.getOrSet(
    cacheKey,
    async () => {
      const [
        totalUsers,
        activeUsers,
        usersByRole,
        usersByStatus,
        totalJobs,
        activeJobs,
        totalApplications,
        totalProjects,
        totalCompanies,
        totalResumes,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: "ACTIVE" } }),
        prisma.user.groupBy({ by: ["role"], _count: { id: true } }),
        prisma.user.groupBy({ by: ["status"], _count: { id: true } }),
        prisma.job.count(),
        prisma.job.count({ where: { isActive: true } }),
        prisma.jobApplication.count(),
        prisma.project.count(),
        prisma.company.count(),
        prisma.resume.count(),
      ]);

      const roleBreakdown = {};
      for (const group of usersByRole) {
        roleBreakdown[group.role] = group._count.id;
      }

      const statusBreakdown = {};
      for (const group of usersByStatus) {
        statusBreakdown[group.status] = group._count.id;
      }

      return {
        users: {
          total: totalUsers,
          active: activeUsers,
          byRole: roleBreakdown,
          byStatus: statusBreakdown,
        },
        jobs: {
          total: totalJobs,
          active: activeJobs,
        },
        applications: {
          total: totalApplications,
        },
        projects: {
          total: totalProjects,
        },
        companies: {
          total: totalCompanies,
        },
        resumes: {
          total: totalResumes,
        },
      };
    },
    REDIS_CONFIG.ttl.DASHBOARD_STATS
  );
}

/**
 * List audit & security logs
 */
async function listAuditLogs({ page = 1, limit = 50, action = null, targetType = null }) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const skip = (safePage - 1) * safeLimit;

  const where = {};
  if (action) where.action = action;
  if (targetType) where.targetType = targetType;

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    }),
  ]);

  return {
    logs,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}

/**
 * Verify / Unverify company
 */
async function verifyCompany({ companyId, isVerified = true, adminId, req = null }) {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    throw new AdminError("Company not found.", 404, "NOT_FOUND");
  }

  const updated = await prisma.company.update({
    where: { id: companyId },
    data: { isVerified: Boolean(isVerified) },
  });

  await recordAuditLog({
    userId: adminId,
    action: "ADMIN_COMPANY_VERIFIED",
    targetType: "Company",
    targetId: companyId,
    details: { isVerified: Boolean(isVerified) },
    req,
  });

  return updated;
}

module.exports = {
  listUsers,
  updateUserRole,
  updateUserStatus,
  getPlatformStats,
  listAuditLogs,
  verifyCompany,
  AdminError,
};
