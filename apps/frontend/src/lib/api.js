/**
 * Centralized API Client for flowCTRL
 * -----------------------------------
 * Automatically includes HTTP-only session cookies (`credentials: "include"`)
 * and attaches CSRF tokens (`x-flowctrl-csrf`) on state-changing requests.
 */

class ApiError extends Error {
  constructor(message, status, code, details = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code || "API_ERROR";
    this.details = details;
  }
}

/**
 * Reads a cookie value by name from document.cookie in browser
 */
function getCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
  return match ? decodeURIComponent(match[3]) : null;
}

/**
 * Core centralized request utility
 */
async function request(endpoint, options = {}) {
  const {
    method = "GET",
    body,
    headers = {},
    ...customConfig
  } = options;

  const defaultHeaders = {
    Accept: "application/json",
    ...headers,
  };

  // Attach CSRF header for state-changing requests
  const isMutating = ["POST", "PUT", "PATCH", "DELETE"].includes(
    method.toUpperCase(),
  );

  if (isMutating) {
    const csrfToken = getCookie("flowctrl_csrf");
    if (csrfToken && !defaultHeaders["x-flowctrl-csrf"]) {
      defaultHeaders["x-flowctrl-csrf"] = csrfToken;
    }
  }

  const config = {
    method,
    headers: defaultHeaders,
    credentials: "include", // Always include cookies for session management
    ...customConfig,
  };

  if (body !== undefined) {
    if (body instanceof FormData) {
      delete defaultHeaders["Content-Type"];
      config.body = body;
    } else {
      defaultHeaders["Content-Type"] = "application/json";
      config.body = typeof body === "string" ? body : JSON.stringify(body);
    }
  }

  const response = await fetch(endpoint, config);

  // Parse JSON response safely
  let data;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMessage =
      (data && typeof data === "object" && (data.error || data.message)) ||
      `Request failed with status ${response.status}`;
    const errorCode =
      (data && typeof data === "object" && data.code) || "HTTP_" + response.status;
    const details = data && typeof data === "object" ? data.details : null;

    throw new ApiError(errorMessage, response.status, errorCode, details);
  }

  return data;
}

export const api = {
  get: (url, options = {}) => request(url, { method: "GET", ...options }),
  post: (url, body, options = {}) => request(url, { method: "POST", body, ...options }),
  put: (url, body, options = {}) => request(url, { method: "PUT", body, ...options }),
  patch: (url, body, options = {}) => request(url, { method: "PATCH", body, ...options }),
  delete: (url, options = {}) => request(url, { method: "DELETE", ...options }),

  // Centralized Auth API Methods
  auth: {
    login: (credentials) => api.post("/api/auth/login", credentials),
    signup: (userData) => api.post("/api/auth/signup", userData),
    me: () => api.get("/api/auth/me"),
    logout: () => api.post("/api/auth/logout"),
    logoutAll: () => api.post("/api/auth/logout-all"),
    changePassword: (data) => api.post("/api/auth/change-password", data),
  },

  // Centralized User & Profile API Methods
  user: {
    getProfile: () => api.get("/api/user/profile"),
    updateProfile: (profileData) => api.put("/api/user/profile", profileData),
    getPreferences: () => api.get("/api/user/preferences"),
    updatePreferences: (prefs) => api.put("/api/user/preferences", prefs),
    getSessions: () => api.get("/api/user/security/sessions"),
    revokeSession: (sessionId) => api.delete(`/api/user/security/sessions/${sessionId}`),
    revokeAllSessions: () => api.post("/api/user/security/sessions/revoke-all"),
  },
};

export { ApiError };
export default api;
