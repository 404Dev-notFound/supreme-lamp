/**
 * Admin Input Validators
 */

const VALID_ROLES = ["USER", "ADMIN"];

const VALID_STATUSES = ["ACTIVE", "SUSPENDED", "DEACTIVATED"];

function validateRoleChange(body = {}) {
  const errors = [];
  const { role } = body;

  if (!role || !VALID_ROLES.includes(role)) {
    errors.push(`Invalid role specified. Must be one of: ${VALID_ROLES.join(", ")}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: { role },
  };
}

function validateStatusChange(body = {}) {
  const errors = [];
  const { status, reason } = body;

  if (!status || !VALID_STATUSES.includes(status)) {
    errors.push(
      `Invalid account status specified. Must be one of: ${VALID_STATUSES.join(", ")}`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      status,
      reason: reason ? String(reason).trim().slice(0, 500) : "",
    },
  };
}

module.exports = {
  validateRoleChange,
  validateStatusChange,
  VALID_ROLES,
  VALID_STATUSES,
};
