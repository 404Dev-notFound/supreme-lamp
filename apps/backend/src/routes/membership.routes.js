const { Router } = require("express");
const membershipController = require("../controllers/membership.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validation.middleware");
const {
  validateUpgrade,
  validateCancel,
} = require("../validators/membership.validator");

const router = Router();

// GET /api/membership/plans - List active membership tiers
router.get("/plans", (req, res, next) =>
  membershipController.getPlans(req, res, next),
);

// GET /api/membership/me - Current user's verified membership status
router.get("/me", requireAuth, (req, res, next) =>
  membershipController.getMyMembership(req, res, next),
);

// POST /api/membership/upgrade - Upgrade or activate premium tier
router.post(
  "/upgrade",
  requireAuth,
  validate(validateUpgrade),
  (req, res, next) => membershipController.upgrade(req, res, next),
);

// POST /api/membership/cancel - Cancel auto-renewing membership
router.post(
  "/cancel",
  requireAuth,
  validate(validateCancel),
  (req, res, next) => membershipController.cancel(req, res, next),
);

// GET /api/membership/history - Audit trail of membership actions & transactions
router.get("/history", requireAuth, (req, res, next) =>
  membershipController.getHistory(req, res, next),
);

module.exports = { membershipRouter: router };

