const { requireAuth, requireRole } = require("./auth.middleware");

module.exports = {
  requireAuth,
  requireRole,
};
