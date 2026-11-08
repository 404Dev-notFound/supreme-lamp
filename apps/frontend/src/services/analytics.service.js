import { apiClient } from "@/lib/api";

function getVisitorId() {
  if (typeof window === "undefined") return "server";
  try {
    let vid = localStorage.getItem("fc_visitor_id");
    if (!vid) {
      vid = "v_" + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
      localStorage.setItem("fc_visitor_id", vid);
    }
    return vid;
  } catch {
    return "anon_visitor";
  }
}

class AnalyticsService {
  /**
   * Track platform user/visitor interaction event
   */
  async trackEvent({ eventType, entityType, entityId, metadata = null }) {
    if (!eventType || !entityType || !entityId) return null;
    const visitorId = getVisitorId();

    try {
      return await apiClient.post("/api/analytics/events", {
        eventType,
        entityType,
        entityId,
        visitorId,
        metadata,
      });
    } catch (err) {
      // Non-blocking telemetry
      return null;
    }
  }

  /**
   * Get public roadmap engagement analytics
   */
  async getRoadmapAnalytics(slug) {
    if (!slug) return null;
    try {
      const res = await apiClient.get(`/api/analytics/roadmaps/${slug}`);
      return res?.data || res;
    } catch {
      return null;
    }
  }

  /**
   * Get administrator platform metrics
   */
  async getPlatformOverview() {
    try {
      const res = await apiClient.get("/api/analytics/platform");
      return res?.data || res;
    } catch {
      return null;
    }
  }
}

export const analyticsService = new AnalyticsService();

