/**
 * Client service for interacting with the Project-Building Tutorials API
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const projectTutorialsService = {
  /**
   * Fetch project catalog with filters, search, and pagination
   */
  async fetchProjects({ search = "", category = "", language = "", difficulty = "", page = 1, limit = 12, sort = "recommended" } = {}) {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (category && category !== "all") params.append("category", category);
    if (language && language !== "all") params.append("language", language);
    if (difficulty && difficulty !== "all") params.append("difficulty", difficulty);
    params.append("page", String(page));
    params.append("limit", String(limit));
    params.append("sort", sort);

    const res = await fetch(`${API_BASE}/api/project-tutorials?${params.toString()}`, {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      throw new Error(`Failed to load projects: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Fetch all categories
   */
  async fetchCategories() {
    const res = await fetch(`${API_BASE}/api/project-tutorials/categories`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to load categories");
    return res.json();
  },

  /**
   * Fetch all languages
   */
  async fetchLanguages() {
    const res = await fetch(`${API_BASE}/api/project-tutorials/languages`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to load languages");
    return res.json();
  },

  /**
   * Fetch project detail by slug
   */
  async fetchProjectBySlug(slug) {
    const res = await fetch(`${API_BASE}/api/project-tutorials/${slug}`, {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to load project: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Start building a project
   */
  async startProject(projectId) {
    const res = await fetch(`${API_BASE}/api/project-tutorials/${projectId}/start`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to start project");
    return res.json();
  },

  /**
   * Update step completion status
   */
  async updateStepProgress(projectId, stepNumber, isCompleted, notes = null) {
    const res = await fetch(`${API_BASE}/api/project-tutorials/${projectId}/steps/${stepNumber}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCompleted, notes }),
    });
    if (!res.ok) throw new Error("Failed to update step progress");
    return res.json();
  },

  /**
   * Mark whole project as complete
   */
  async completeProject(projectId) {
    const res = await fetch(`${API_BASE}/api/project-tutorials/${projectId}/complete`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to complete project");
    return res.json();
  },

  /**
   * Fetch current user's active and completed projects
   */
  async fetchMyProgress() {
    const res = await fetch(`${API_BASE}/api/project-tutorials/user/my-progress`, {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to fetch my progress");
    return res.json();
  },

  /**
   * Toggle project bookmark
   */
  async toggleBookmark(projectId) {
    const res = await fetch(`${API_BASE}/api/project-tutorials/${projectId}/bookmark`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to toggle bookmark");
    return res.json();
  },

  /**
   * Fetch current user's bookmarked projects
   */
  async fetchMyBookmarks() {
    const res = await fetch(`${API_BASE}/api/project-tutorials/user/bookmarks`, {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to fetch bookmarks");
    return res.json();
  },
};
