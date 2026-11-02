/**
 * Centralized Authentication API Client
 * --------------------------------------
 * Direct communication interface between Frontend and Backend API.
 * Ensures credentials (HTTP-only cookies) and CSRF protection headers
 * are always transmitted securely.
 */

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getCsrfToken() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(^|;\\s*)flowctrl_csrf=([^;]*)"),
  );
  return match ? decodeURIComponent(match[2]) : null;
}

async function request(endpoint, options = {}) {
  const url = endpoint.startsWith("http") ? endpoint : `${BACKEND_URL}${endpoint}`;
  const headers = {
    Accept: "application/json",
    ...options.headers,
  };

  const isMutating = ["POST", "PUT", "PATCH", "DELETE"].includes(
    (options.method || "GET").toUpperCase(),
  );

  if (isMutating) {
    const csrfToken = getCsrfToken();
    if (csrfToken && !headers["x-flowctrl-csrf"]) {
      headers["x-flowctrl-csrf"] = csrfToken;
    }
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    options.body =
      typeof options.body === "string"
        ? options.body
        : JSON.stringify(options.body);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // Send & store HTTP-Only cookies
  });

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
    const message =
      (data && typeof data === "object" && (data.error || data.message)) ||
      `Request failed with status ${response.status}`;
    const code =
      (data && typeof data === "object" && data.code) || "HTTP_" + response.status;
    const error = new Error(message);
    error.status = response.status;
    error.code = code;
    error.details = data && typeof data === "object" ? data.details : null;
    throw error;
  }

  return data;
}

export const authApi = {
  signUp: (payload) =>
    request("/api/auth/signup", {
      method: "POST",
      body: payload,
    }),

  signIn: (credentials) =>
    request("/api/auth/signin", {
      method: "POST",
      body: credentials,
    }),

  login: (credentials) =>
    request("/api/auth/login", {
      method: "POST",
      body: credentials,
    }),

  me: () =>
    request("/api/auth/me", {
      method: "GET",
    }),

  logout: () =>
    request("/api/auth/logout", {
      method: "POST",
    }),

  logoutAll: () =>
    request("/api/auth/logout-all", {
      method: "POST",
    }),

  changePassword: (data) =>
    request("/api/auth/change-password", {
      method: "POST",
      body: data,
    }),
};

export default authApi;
