import { membershipApi } from "../api/membership";

/**
 * Frontend Membership Client Service
 */
export const membershipService = {
  async fetchPlans() {
    try {
      const res = await membershipApi.getPlans();
      return { success: true, plans: res.plans || [] };
    } catch (err) {
      return { success: false, error: err.message, plans: [] };
    }
  },

  async fetchMyStatus() {
    try {
      const res = await membershipApi.getMyMembership();
      return {
        success: true,
        isPremium: Boolean(res.isPremium),
        tier: res.tier || "FREE",
        status: res.status || "ACTIVE",
        plan: res.plan,
        expiresAt: res.expiresAt,
        daysRemaining: res.daysRemaining,
        autoRenew: res.autoRenew,
      };
    } catch (err) {
      return {
        success: false,
        isPremium: false,
        tier: "FREE",
        status: "GUEST",
        error: err.message,
      };
    }
  },

  async upgradePlan({ planCode, paymentMethod = "mock", autoRenew = true }) {
    try {
      const res = await membershipApi.upgrade({ planCode, paymentMethod, autoRenew });
      return { success: true, ...res };
    } catch (err) {
      return { success: false, error: err.message, code: err.code };
    }
  },

  async cancelAutoRenew({ reason = "" } = {}) {
    try {
      const res = await membershipApi.cancel({ reason });
      return { success: true, ...res };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async fetchHistory() {
    try {
      const res = await membershipApi.getHistory();
      return {
        success: true,
        history: res.history || [],
        transactions: res.transactions || [],
      };
    } catch (err) {
      return { success: false, error: err.message, history: [], transactions: [] };
    }
  },
};

