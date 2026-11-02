const membershipService = require("../services/membership.service");

class MembershipController {
  async getPlans(req, res, next) {
    try {
      const plans = await membershipService.getPlans();
      res.setHeader("Cache-Control", "public, max-age=60");
      return res.status(200).json({
        success: true,
        plans,
      });
    } catch (err) {
      next(err);
    }
  }

  async getMyMembership(req, res, next) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          code: "UNAUTHORIZED",
          error: "Authentication required to view membership status.",
        });
      }

      const status = await membershipService.getUserMembership(userId);
      res.setHeader("Cache-Control", "no-store, max-age=0");
      return res.status(200).json({
        success: true,
        ...status,
      });
    } catch (err) {
      next(err);
    }
  }

  async upgrade(req, res, next) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          code: "UNAUTHORIZED",
          error: "Authentication required to upgrade membership.",
        });
      }

      const { planCode, paymentMethod, autoRenew } = req.validatedBody || req.body;
      const result = await membershipService.upgradeMembership({
        userId,
        planCode,
        paymentMethod,
        autoRenew,
        req,
      });

      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async cancel(req, res, next) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          code: "UNAUTHORIZED",
          error: "Authentication required to cancel membership.",
        });
      }

      const { reason } = req.validatedBody || req.body;
      const result = await membershipService.cancelMembership({
        userId,
        reason,
        req,
      });

      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getHistory(req, res, next) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          code: "UNAUTHORIZED",
          error: "Authentication required to view membership history.",
        });
      }

      const data = await membershipService.getMembershipHistory(userId);
      res.setHeader("Cache-Control", "no-store, max-age=0");
      return res.status(200).json({
        success: true,
        ...data,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new MembershipController();

