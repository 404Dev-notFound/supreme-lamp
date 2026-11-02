const usersService = require("../services/users.service");
const {
  validateUserId,
  validateSessionId,
  validateAvatarId,
  validateProfileUpdate,
} = require("../validators/users.validator");

class UsersController {
  async getProfile(req, res, next) {
    try {
      const userId = req.user.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          code: "UNAUTHORIZED",
          error: "Authentication required.",
        });
      }

      const profile = await usersService.getUserProfile(userId);
      res.setHeader("Cache-Control", "no-store, max-age=0");
      return res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          code: "UNAUTHORIZED",
          error: "Authentication required.",
        });
      }

      const { isValid, errors, sanitized } = validateProfileUpdate(req.body);
      if (!isValid) {
        return res.status(400).json({
          success: false,
          code: "VALIDATION_ERROR",
          error: errors[0] || "Profile validation failed.",
          details: errors,
        });
      }

      const updated = await usersService.updateUserProfile(userId, sanitized);
      res.setHeader("Cache-Control", "no-store, max-age=0");
      return res.status(200).json({
        success: true,
        message: "Profile updated successfully.",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSessions(req, res, next) {
    try {
      const userId = req.user.id;
      const sessions = await usersService.listUserSessions(userId);

      res.setHeader("Cache-Control", "no-store, max-age=0");
      return res.status(200).json({
        success: true,
        data: sessions,
      });
    } catch (error) {
      next(error);
    }
  }

  async revokeSession(req, res, next) {
    try {
      const userId = req.user.id;
      const validSession = validateSessionId(req.params.sessionId);
      if (!validSession.isValid) {
        return res.status(400).json({
          success: false,
          code: "INVALID_IDENTIFIER",
          error: validSession.error,
        });
      }

      const result = await usersService.revokeUserSession(
        userId,
        validSession.id,
      );
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async revokeAllSessions(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await usersService.revokeAllUserSessions(userId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getPublicProfile(req, res, next) {
    try {
      const validUser = validateUserId(req.params.id);
      if (!validUser.isValid) {
        return res.status(400).json({
          success: false,
          code: "INVALID_IDENTIFIER",
          error: validUser.error,
        });
      }

      const profile = await usersService.getPublicProfile(validUser.id);
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=120");
      return res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadAvatar(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          code: "NO_FILE_UPLOADED",
          error: "Please provide an image file (PNG, JPEG, or WebP).",
        });
      }

      const userId = req.user.id;
      const result = await usersService.uploadAvatar(userId, req.file);

      return res.status(200).json({
        success: true,
        message: "Avatar uploaded successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAvatar(req, res, next) {
    try {
      const validAvatar = validateAvatarId(req.params.avatarId);
      if (!validAvatar.isValid) {
        return res.status(400).json({
          success: false,
          code: "INVALID_IDENTIFIER",
          error: validAvatar.error,
        });
      }

      const { mimeType, stream } = usersService.getAvatarFile(validAvatar.id);
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800");
      stream.pipe(res);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UsersController();

