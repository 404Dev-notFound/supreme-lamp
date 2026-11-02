/**
 * Membership Input Validators
 * ----------------------------
 * Validates plan selection, checkout parameters, and cancellation requests.
 */

const ALLOWED_UPGRADE_PLANS = ["PREMIUM_MONTHLY", "PREMIUM_ANNUAL"];

function validateUpgrade(data = {}) {
  const errors = [];
  const { planCode, paymentMethod = "mock", autoRenew = true } = data;

  if (!planCode || typeof planCode !== "string") {
    errors.push("Membership plan code is required.");
  } else if (!ALLOWED_UPGRADE_PLANS.includes(planCode.toUpperCase())) {
    errors.push(
      `Invalid plan code. Allowed plans: ${ALLOWED_UPGRADE_PLANS.join(", ")}`,
    );
  }

  const sanitized = {
    planCode: typeof planCode === "string" ? planCode.toUpperCase() : "",
    paymentMethod: typeof paymentMethod === "string" ? paymentMethod.toLowerCase() : "mock",
    autoRenew: Boolean(autoRenew),
  };

  return {
    isValid: errors.length === 0,
    errors,
    sanitized,
  };
}

function validateCancel(data = {}) {
  const { reason = "" } = data;

  return {
    isValid: true,
    errors: [],
    sanitized: {
      reason: typeof reason === "string" ? reason.trim().slice(0, 500) : "",
    },
  };
}

module.exports = {
  ALLOWED_UPGRADE_PLANS,
  validateUpgrade,
  validateCancel,
};

