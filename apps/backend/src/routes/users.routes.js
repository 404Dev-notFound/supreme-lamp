const { Router } = require("express");
const multer = require("multer");
const usersController = require("../controllers/users.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const {
  userMutationRateLimiter,
} = require("../middleware/rateLimit.middleware");

const router = Router();

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB
  fileFilter: (req, file, cb) => {
    if (["image/png", "image/jpeg", "image/webp"].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only PNG, JPEG, and WebP image files are allowed for avatars.",
        ),
        false,
      );
    }
  },
});

// Profile endpoints
router.get("/profile", requireAuth, (req, res, next) =>
  usersController.getProfile(req, res, next),
);

router.put(
  "/profile",
  requireAuth,
  userMutationRateLimiter,
  (req, res, next) => usersController.updateProfile(req, res, next),
);

// Session security management
router.get("/security/sessions", requireAuth, (req, res, next) =>
  usersController.getSessions(req, res, next),
);

router.delete(
  "/security/sessions/:sessionId",
  requireAuth,
  userMutationRateLimiter,
  (req, res, next) => usersController.revokeSession(req, res, next),
);

router.post(
  "/security/sessions/revoke-all",
  requireAuth,
  userMutationRateLimiter,
  (req, res, next) => usersController.revokeAllSessions(req, res, next),
);

// Public profile
router.get("/:id", (req, res, next) =>
  usersController.getPublicProfile(req, res, next),
);

// Avatar upload and streaming
router.post(
  "/avatar",
  requireAuth,
  userMutationRateLimiter,
  avatarUpload.single("avatar"),
  (req, res, next) => usersController.uploadAvatar(req, res, next),
);

router.get("/avatar/:avatarId", (req, res, next) =>
  usersController.getAvatar(req, res, next),
);

module.exports = { usersRouter: router };

