import { apiClient } from "@/lib/api";

function getVisitorId() {
  return "without_signin";
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
    } catch {
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

