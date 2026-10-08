const { Router } = require("express");
const adminController = require("../controllers/admin.controller");
const { requireAuth, requireRole } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validation.middleware");
const {
  validateRoleChange,
  validateStatusChange,
} = require("../validators/admin.validator");

const router = Router();

// Enforce strict Admin / Super Admin authorization across all admin routes
router.use(requireAuth, requireRole(["ADMIN", "SUPER_ADMIN"]));

// GET /api/admin/stats - Overview metrics
router.get("/stats", adminController.getStats);

// GET /api/admin/users - User directory & moderation
router.get("/users", adminController.listUsers);

// PATCH /api/admin/users/:userId/role - Promote/demote user role
router.patch(
  "/users/:userId/role",
  validate(validateRoleChange),
  adminController.updateUserRole,
);

// PATCH /api/admin/users/:userId/status - Suspend or reactivate user
router.patch(
  "/users/:userId/status",
  validate(validateStatusChange),
  adminController.updateUserStatus,
);

// GET /api/admin/audit-logs - Structured security & audit trail
router.get("/audit-logs", adminController.listAuditLogs);

// PATCH /api/admin/companies/:id/verify - Verify company profile
router.patch("/companies/:id/verify", adminController.verifyCompany);

module.exports = { adminRouter: router };
