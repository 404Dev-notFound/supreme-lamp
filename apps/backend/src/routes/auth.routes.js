const { Router } = require("express");
const authController = require("../controllers/auth.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { authRateLimiter } = require("../middleware/rateLimit.middleware");
const { validate } = require("../middleware/validation.middleware");
const {
  validateSignup,
  validateSignin,
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword,
} = require("../validators/auth.validator");

const router = Router();

/**
 * Public Authentication Endpoints
 */

// POST /api/auth/signup - Register new user account
router.post(
  "/signup",
  authRateLimiter,
  validate(validateSignup),
  authController.signup,
);

// POST /api/auth/signin - Sign in with credentials
router.post(
  "/signin",
  authRateLimiter,
  validate(validateSignin),
  authController.signin,
);

// POST /api/auth/login - Legacy alias for signin
router.post(
  "/login",
  authRateLimiter,
  validate(validateSignin),
  authController.signin,
);

// POST /api/auth/forgot-password - Dispatch password reset token
router.post(
  "/forgot-password",
  authRateLimiter,
  validate(validateForgotPassword),
  authController.forgotPassword,
);

// POST /api/auth/reset-password - Reset password using verified token
router.post(
  "/reset-password",
  authRateLimiter,
  validate(validateResetPassword),
  authController.resetPassword,
);

// GET /api/auth/me - Retrieve current session and user context
router.get("/me", authController.me);

// POST /api/auth/logout - Invalidate current session
router.post("/logout", authController.logout);

/**
 * Authenticated Endpoints
 */

// POST /api/auth/logout-all - Invalidate all active sessions for current user
router.post("/logout-all", requireAuth, authController.logoutAll);

// POST /api/auth/change-password - Change password and refresh session
router.post(
  "/change-password",
  requireAuth,
  authRateLimiter,
  validate(validateChangePassword),
  authController.changePassword,
);

module.exports = {
  authRouter: router,
};
