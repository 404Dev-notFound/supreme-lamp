/**
 * Membership & Resources API Client
 * ---------------------------------
 * Handles fetching plans, user membership state, upgrading tiers, and curated resources.
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
    credentials: "include",
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
    data = { error: await response.text() };
  }

  if (!response.ok) {
    const error = new Error(
      data?.error || data?.message || `HTTP ${response.status}: Request failed`,
    );
    error.status = response.status;
    error.code = data?.code;
    error.data = data;
    throw error;
  }

  return data;
}

export const membershipApi = {
  getPlans() {
    return request("/api/membership/plans");
  },

  getMyMembership() {
    return request("/api/membership/me");
  },

  upgrade({ planCode, paymentMethod = "mock", autoRenew = true }) {
    return request("/api/membership/upgrade", {
      method: "POST",
      body: { planCode, paymentMethod, autoRenew },
    });
  },

  cancel({ reason = "" } = {}) {
    return request("/api/membership/cancel", {
      method: "POST",
      body: { reason },
    });
  },

  getHistory() {
    return request("/api/membership/history");
  },

  getResources({ category, level, search } = {}) {
    const params = new URLSearchParams();
    if (category && category !== "all") params.set("category", category);
    if (level) params.set("level", level);
    if (search) params.set("search", search);
    const qs = params.toString();
    return request(`/api/resources${qs ? `?${qs}` : ""}`);
  },

  getResourceBySlug(slug) {
    return request(`/api/resources/${encodeURIComponent(slug)}`);
  },

  getCategories() {
    return request("/api/resources/categories");
  },
};

