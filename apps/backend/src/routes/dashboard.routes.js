const { Router } = require("express");
const { requireAuth } = require("../middleware/auth.middleware");
const { getAccountDashboard } = require("../controllers/dashboard.controller");

const router = Router();

// GET /api/dashboard - Centralized account-specific database-driven dashboard metrics
router.get("/", requireAuth, getAccountDashboard);

module.exports = { dashboardRouter: router };

