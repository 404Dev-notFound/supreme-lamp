/**
 * Enterprise Dashboard Client Service
 * 
 * Securely communicates with the backend /api/dashboard endpoint with HTTP-only credentials.
 * Ensures data is strictly scoped to the active session.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const dashboardService = {
  /**
   * Fetch live account-specific dashboard data from backend database
   */
  async fetchDashboard() {
    const res = await fetch(`${API_BASE}/api/dashboard`, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache",
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        return null; // Guest or unauthenticated state
      }
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `Failed to load dashboard: ${res.statusText}`);
    }

    const json = await res.json();
    return json.data || json;
  },
};

