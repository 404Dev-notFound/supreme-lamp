/**
 * Enterprise Admin Client Service
 * 
 * Securely communicates with the backend /api/admin, /api/rag, and /api/ready endpoints
 * using authenticated HTTP-only session cookies and CSRF double-submit protection tokens.
 * Normalizes all API responses into predictable, typed structures for UI components.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getCsrfToken() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)flowctrl_csrf=([^;]*)"));
  return match ? decodeURIComponent(match[2]) : null;
}

export const adminService = {
  /**
   * Fetch overview platform metrics
   */
  async fetchStats() {
    const res = await fetch(`${API_BASE}/api/admin/stats`, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err.message || err.error || `HTTP ${res.status}: ${res.statusText}`;
      throw new Error(msg);
    }

    const json = await res.json();
    return json.data || json;
  },

  async fetchPlatformAnalytics(page = 1, limit = 50) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    const res = await fetch(`${API_BASE}/api/analytics/platform?${params}`, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || `HTTP ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    return json.data || json;
  },

  /**
   * Fetch platform users with pagination, role/status filtering, and server-side search.
   * Normalizes response into { users: [...], pagination: { page, limit, total, totalPages } }.
   */
  async fetchUsers({ page = 1, limit = 15, search = "", role = "", status = "" } = {}, signal = null) {
    const params = new URLSearchParams();
    if (page) params.set("page", String(page));
    if (limit) params.set("limit", String(limit));
    if (search && search.trim()) params.set("search", search.trim());
    if (role && role.trim()) params.set("role", role.trim());
    if (status && status.trim()) params.set("status", status.trim());

    const fetchOptions = {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    };
    if (signal) fetchOptions.signal = signal;

    const res = await fetch(`${API_BASE}/api/admin/users?${params.toString()}`, fetchOptions);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err.message || err.error || `HTTP ${res.status}: ${res.statusText}`;
      const error = new Error(msg);
      error.status = res.status;
      throw error;
    }

    const json = await res.json();
    
    // Explicit API Contract Normalization:
    // The server returns user records directly in json.data and pagination metadata in json.meta
    // Do NOT expect json.data.users or json.data.pagination
    const users = Array.isArray(json.data)
      ? json.data
      : Array.isArray(json.users)
      ? json.users
      : Array.isArray(json)
      ? json
      : [];

    const meta = json.meta || json.pagination || {};
    const parsedPage = Number(meta.page || page) || 1;
    const parsedLimit = Number(meta.limit || limit) || 15;
    const parsedTotal = typeof meta.total === "number" ? meta.total : users.length;
    const parsedTotalPages = typeof meta.totalPages === "number"
      ? meta.totalPages
      : Math.max(1, Math.ceil(parsedTotal / parsedLimit));

    return {
      users,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total: parsedTotal,
        totalPages: parsedTotalPages,
      },
    };
  },

  /**
   * Promote or demote user role (USER <-> ADMIN)
   */
  async updateUserRole(userId, newRole) {
    if (!userId) throw new Error("Target user ID is required.");
    if (!["USER", "ADMIN"].includes(newRole)) {
      throw new Error(`Invalid role '${newRole}'. Allowed roles are USER or ADMIN.`);
    }

    const csrfToken = getCsrfToken();
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (csrfToken) headers["x-flowctrl-csrf"] = csrfToken;

    const res = await fetch(`${API_BASE}/api/admin/users/${encodeURIComponent(userId)}/role`, {
      method: "PATCH",
      credentials: "include",
      headers,
      body: JSON.stringify({ role: newRole }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err.message || err.error || `HTTP ${res.status}: ${res.statusText}`;
      throw new Error(msg);
    }

    const json = await res.json();
    return json.data || json;
  },

  /**
   * Suspend or reactivate user account
   */
  async updateUserStatus(userId, newStatus, reason = "") {
    if (!userId) throw new Error("Target user ID is required.");
    if (!["ACTIVE", "SUSPENDED", "DEACTIVATED"].includes(newStatus)) {
      throw new Error(`Invalid status '${newStatus}'. Allowed values: ACTIVE, SUSPENDED, DEACTIVATED.`);
    }

    const csrfToken = getCsrfToken();
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (csrfToken) headers["x-flowctrl-csrf"] = csrfToken;

    const res = await fetch(`${API_BASE}/api/admin/users/${encodeURIComponent(userId)}/status`, {
      method: "PATCH",
      credentials: "include",
      headers,
      body: JSON.stringify({ status: newStatus, reason }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err.message || err.error || `HTTP ${res.status}: ${res.statusText}`;
      throw new Error(msg);
    }

    const json = await res.json();
    return json.data || json;
  },

  /**
   * Fetch structured audit logs with pagination and action filtering.
   * Normalizes response into { logs: [...], pagination: { page, limit, total, totalPages } }.
   */
  async fetchAuditLogs({ page = 1, limit = 20, action = "", targetType = "" } = {}) {
    const params = new URLSearchParams();
    if (page) params.set("page", String(page));
    if (limit) params.set("limit", String(limit));
    if (action && action.trim()) params.set("action", action.trim());
    if (targetType && targetType.trim()) params.set("targetType", targetType.trim());

    const res = await fetch(`${API_BASE}/api/admin/audit-logs?${params.toString()}`, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err.message || err.error || `HTTP ${res.status}: ${res.statusText}`;
      throw new Error(msg);
    }

    const json = await res.json();

    // Backend contract: { success: true, data: Array(logs), meta: { page, limit, total, totalPages } }
    const logs = Array.isArray(json.data)
      ? json.data
      : Array.isArray(json.logs)
      ? json.logs
      : Array.isArray(json)
      ? json
      : [];

    const meta = json.meta || json.pagination || {};
    const parsedPage = Number(meta.page || page) || 1;
    const parsedLimit = Number(meta.limit || limit) || 20;
    const parsedTotal = typeof meta.total === "number" ? meta.total : logs.length;
    const parsedTotalPages = typeof meta.totalPages === "number"
      ? meta.totalPages
      : Math.max(1, Math.ceil(parsedTotal / parsedLimit));

    return {
      logs,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total: parsedTotal,
        totalPages: parsedTotalPages,
      },
    };
  },

  /**
   * Live RAG diagnostics across Express, Python RAG, and Qdrant
   */
  async fetchRagHealth() {
    const res = await fetch(`${API_BASE}/api/rag/health`, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err.message || err.error || `HTTP ${res.status}: ${res.statusText}`;
      throw new Error(msg);
    }

    const json = await res.json();
    return json.data || json;
  },

  /**
   * Backend infrastructure readiness probe (/api/ready)
   * Real checks for PostgreSQL database and Redis connectivity.
   */
  async fetchSystemReadiness() {
    const res = await fetch(`${API_BASE}/api/ready`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err.error || err.message || `HTTP ${res.status}: ${res.statusText}`;
      throw new Error(msg);
    }

    return await res.json();
  },

  /**
   * Backend core health probe (/api/health)
   * Real checks for Express uptime and Redis fallback state.
   */
  async fetchBackendHealth() {
    const res = await fetch(`${API_BASE}/api/health`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err.error || err.message || `HTTP ${res.status}: ${res.statusText}`;
      throw new Error(msg);
    }

    return await res.json();
  },

  /**
   * Trigger RAG knowledge base reindex
   */
  async triggerRagReindex(adminKey = "", limit = null) {
    const csrfToken = getCsrfToken();
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (csrfToken) headers["x-flowctrl-csrf"] = csrfToken;
    if (adminKey && adminKey.trim()) headers["x-admin-key"] = adminKey.trim();

    const body = {};
    if (limit && Number(limit) > 0) body.limit = Number(limit);

    const res = await fetch(`${API_BASE}/api/rag/admin/reindex`, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err.message || err.error || `HTTP ${res.status}: ${res.statusText}`;
      throw new Error(msg);
    }

    return await res.json();
  },
};

export default adminService;
