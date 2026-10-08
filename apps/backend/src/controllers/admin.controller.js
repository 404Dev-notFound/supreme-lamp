const adminService = require("../services/admin.service");
const { successResponse } = require("../utils/response");

async function listUsers(req, res, next) {
  try {
    const { page, limit, search, role, status } = req.query;
    const result = await adminService.listUsers({
      page,
      limit,
      search,
      role,
      status,
    });
    return successResponse(res, {
      data: result.users,
      meta: result.pagination,
      req,
    });
  } catch (err) {
    next(err);
  }
}

async function updateUserRole(req, res, next) {
  try {
    const { userId } = req.params;
    const { role } = req.validatedBody || req.body;
    const updated = await adminService.updateUserRole({
      targetUserId: userId,
      newRole: role,
      currentAdminId: req.user.id,
      currentAdminRole: req.user.role,
      req,
    });
    return successResponse(res, {
      data: updated,
      message: `User role updated to ${role}.`,
      req,
    });
  } catch (err) {
    next(err);
  }
}

async function updateUserStatus(req, res, next) {
  try {
    const { userId } = req.params;
    const { status, reason } = req.validatedBody || req.body;
    const updated = await adminService.updateUserStatus({
      targetUserId: userId,
      newStatus: status,
      reason,
      currentAdminId: req.user.id,
      currentAdminRole: req.user.role,
      req,
    });
    return successResponse(res, {
      data: updated,
      message: `User status changed to ${status}.`,
      req,
    });
  } catch (err) {
    next(err);
  }
}

async function getStats(req, res, next) {
  try {
    const stats = await adminService.getPlatformStats();
    return successResponse(res, { data: stats, req });
  } catch (err) {
    next(err);
  }
}

async function listAuditLogs(req, res, next) {
  try {
    const { page, limit, action, targetType } = req.query;
    const result = await adminService.listAuditLogs({
      page,
      limit,
      action,
      targetType,
    });
    return successResponse(res, {
      data: result.logs,
      meta: result.pagination,
      req,
    });
  } catch (err) {
    next(err);
  }
}

async function verifyCompany(req, res, next) {
  try {
    const { id } = req.params;
    const { isVerified = true } = req.body;
    const updated = await adminService.verifyCompany({
      companyId: id,
      isVerified,
      adminId: req.user.id,
      req,
    });
    return successResponse(res, {
      data: updated,
      message: `Company verification updated to ${isVerified}.`,
      req,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listUsers,
  updateUserRole,
  updateUserStatus,
  getStats,
  listAuditLogs,
  verifyCompany,
};
