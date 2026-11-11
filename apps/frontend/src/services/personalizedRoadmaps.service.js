/**
 * Client Service for Personalized RAG Roadmaps & Dynamic Graph
 * FlowCTRL Enterprise
 */

import { clearClientCache } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

class PersonalizedRoadmapsClientService {
  /**
   * Fetch all personalized roadmaps for authenticated user
   */
  async listUserRoadmaps({ page = 1, limit = 10 } = {}) {
    try {
      // Try Next.js API route first, fallback to Express backend
      const res = await fetch(`/api/personalized-roadmaps?page=${page}&limit=${limit}`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch {
      // Fallback to Express backend directly
    }

    try {
      const backendRes = await fetch(`${API_BASE}/api/personalized-roadmaps?page=${page}&limit=${limit}`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (backendRes.ok) {
        const json = await backendRes.json();
        return json.data || json;
      }
    } catch (err) {
      console.warn("[PersonalizedRoadmaps] List error:", err.message);
    }

    return { roadmaps: [], pagination: { total: 0, page: 1, limit, totalPages: 0 } };
  }

  /**
   * Fetch complete graph for a personalized roadmap by ID
   */
  async getRoadmapById(id) {
    if (!id) return null;

    try {
      const res = await fetch(`/api/personalized-roadmaps/${id}`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch {
      // Fallback
    }

    try {
      const res = await fetch(`${API_BASE}/api/personalized-roadmaps/${id}`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch (err) {
      console.warn(`[PersonalizedRoadmaps] Detail fetch error for ${id}:`, err.message);
    }

    return null;
  }

  /**
   * Persist a generated roadmap directly
   */
  async saveRoadmap(payload) {
    try {
      const res = await fetch(`/api/personalized-roadmaps`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        clearClientCache();
        return json.data || json;
      }
    } catch {
      // Fallback
    }

    try {
      const res = await fetch(`${API_BASE}/api/personalized-roadmaps`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        clearClientCache();
        return json.data || json;
      }
    } catch (err) {
      console.error("[PersonalizedRoadmaps] Save failed:", err);
    }
    return null;
  }

  /**
   * Update completion status of a topic node in PostgreSQL
   */
  async updateTopicProgress(roadmapId, stepId, status) {
    if (!roadmapId || !stepId || !status) return null;

    try {
      const res = await fetch(`/api/personalized-roadmaps/${roadmapId}/progress`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId, status }),
      });

      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch {
      // Fallback
    }

    try {
      const res = await fetch(`${API_BASE}/api/personalized-roadmaps/${roadmapId}/progress`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId, status }),
      });

      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch (err) {
      console.warn("[PersonalizedRoadmaps] Progress update failed:", err.message);
    }

    return null;
  }

  /**
   * Delete a personalized roadmap
   */
  async deleteRoadmap(roadmapId) {
    if (!roadmapId) return false;

    try {
      const res = await fetch(`/api/personalized-roadmaps/${roadmapId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        clearClientCache();
        return true;
      }
    } catch {
      // Fallback
    }

    try {
      const res = await fetch(`${API_BASE}/api/personalized-roadmaps/${roadmapId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        clearClientCache();
        return true;
      }
    } catch (err) {
      console.warn("[PersonalizedRoadmaps] Delete failed:", err.message);
    }
    return false;
  }
}

export const personalizedRoadmapsClient = new PersonalizedRoadmapsClientService();
