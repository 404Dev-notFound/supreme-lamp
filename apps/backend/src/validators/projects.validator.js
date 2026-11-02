const { isSafeUrl } = require("../utils/security");

const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;
const VALID_ISSUE_STATUSES = ["TODO", "IN_PROGRESS", "DONE"];
const VALID_ISSUE_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

function validateProjectId(id) {
  if (!id || typeof id !== "string" || !SAFE_ID_REGEX.test(id.trim())) {
    return { isValid: false, error: "Valid project identifier required." };
  }
  return { isValid: true, id: id.trim() };
}

function validateIssueId(id) {
  if (!id || typeof id !== "string" || !SAFE_ID_REGEX.test(id.trim())) {
    return { isValid: false, error: "Valid issue identifier required." };
  }
  return { isValid: true, id: id.trim() };
}

function validateCreateProject(body) {
  const errors = [];
  if (!body || typeof body !== "object") {
    return { isValid: false, errors: ["Project payload must be an object."] };
  }

  const {
    title,
    category,
    difficulty,
    techStack,
    image,
    description,
    githubUrl,
    isPinned,
    isDemo,
  } = body;

  if (!title || typeof title !== "string" || !title.trim()) {
    errors.push("Project title is required.");
  }

  let parsedTechStack = [];
  if (Array.isArray(techStack)) {
    parsedTechStack = techStack.map((t) => String(t).trim()).filter(Boolean);
  } else if (typeof techStack === "string") {
    parsedTechStack = techStack
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  let safeGithub = null;
  if (githubUrl && typeof githubUrl === "string" && githubUrl.trim()) {
    const cleanUrl = githubUrl.trim();
    if (isSafeUrl(cleanUrl)) {
      safeGithub = cleanUrl;
    }
  }

  let safeImage = null;
  if (image && typeof image === "string" && image.trim()) {
    const cleanImg = image.trim();
    if (isSafeUrl(cleanImg)) {
      safeImage = cleanImg;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      title: title ? title.trim().slice(0, 150) : "",
      category: category ? String(category).trim().slice(0, 50) : "General",
      difficulty: difficulty ? String(difficulty).trim().slice(0, 50) : "Intermediate",
      techStack: parsedTechStack,
      image: safeImage,
      description: description ? String(description).trim() : "",
      githubUrl: safeGithub,
      isPinned: Boolean(isPinned),
      isDemo: Boolean(isDemo),
    },
  };
}

function validateUpdateProject(body) {
  const errors = [];
  if (!body || typeof body !== "object") {
    return { isValid: false, errors: ["Update payload must be an object."] };
  }

  const {
    title,
    category,
    difficulty,
    techStack,
    image,
    description,
    githubUrl,
    isPinned,
    isDemo,
  } = body;

  const updateData = {};

  if (title !== undefined) {
    if (typeof title !== "string" || !title.trim()) {
      errors.push("Project title cannot be empty.");
    } else {
      updateData.title = title.trim().slice(0, 150);
    }
  }

  if (category !== undefined) {
    updateData.category = String(category).trim().slice(0, 50);
  }

  if (difficulty !== undefined) {
    updateData.difficulty = String(difficulty).trim().slice(0, 50);
  }

  if (techStack !== undefined) {
    if (Array.isArray(techStack)) {
      updateData.techStack = techStack
        .map((t) => String(t).trim())
        .filter(Boolean);
    } else if (typeof techStack === "string") {
      updateData.techStack = techStack
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  if (image !== undefined) {
    updateData.image = image && isSafeUrl(image.trim()) ? image.trim() : null;
  }

  if (description !== undefined) {
    updateData.description = String(description).trim();
  }

  if (githubUrl !== undefined) {
    updateData.githubUrl =
      githubUrl && isSafeUrl(githubUrl.trim()) ? githubUrl.trim() : null;
  }

  if (isPinned !== undefined) {
    updateData.isPinned = Boolean(isPinned);
  }

  if (isDemo !== undefined) {
    updateData.isDemo = Boolean(isDemo);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: updateData,
  };
}

function validateCreateIssue(body) {
  const errors = [];
  if (!body || typeof body !== "object") {
    return { isValid: false, errors: ["Issue payload must be an object."] };
  }

  const { title, description, status, priority, tags, assigneeId } = body;

  if (!title || typeof title !== "string" || !title.trim()) {
    errors.push("Issue title is required.");
  }

  const issueStatus = VALID_ISSUE_STATUSES.includes(status) ? status : "TODO";
  const issuePriority = VALID_ISSUE_PRIORITIES.includes(priority)
    ? priority
    : "MEDIUM";

  let tagsArray = [];
  if (Array.isArray(tags)) {
    tagsArray = tags.map((t) => String(t).trim()).filter(Boolean);
  } else if (typeof tags === "string") {
    tagsArray = tags
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      title: title ? title.trim().slice(0, 200) : "",
      description: description ? String(description).trim() : "",
      status: issueStatus,
      priority: issuePriority,
      tags: tagsArray,
      assigneeId: assigneeId ? String(assigneeId).trim() : null,
    },
  };
}

function validateUpdateIssue(body) {
  if (!body || typeof body !== "object") {
    return { isValid: false, errors: ["Update payload must be an object."] };
  }

  const { title, description, status, priority, tags, assigneeId } = body;
  const updateData = {};

  if (title !== undefined && typeof title === "string" && title.trim()) {
    updateData.title = title.trim().slice(0, 200);
  }
  if (description !== undefined) {
    updateData.description = String(description).trim();
  }
  if (status !== undefined && VALID_ISSUE_STATUSES.includes(status)) {
    updateData.status = status;
  }
  if (priority !== undefined && VALID_ISSUE_PRIORITIES.includes(priority)) {
    updateData.priority = priority;
  }
  if (tags !== undefined) {
    updateData.tags = Array.isArray(tags)
      ? tags.map((t) => String(t).trim()).filter(Boolean)
      : String(tags)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
  }
  if (assigneeId !== undefined) {
    updateData.assigneeId = assigneeId ? String(assigneeId).trim() : null;
  }

  return {
    isValid: true,
    errors: [],
    sanitized: updateData,
  };
}

module.exports = {
  SAFE_ID_REGEX,
  VALID_ISSUE_STATUSES,
  VALID_ISSUE_PRIORITIES,
  validateProjectId,
  validateIssueId,
  validateCreateProject,
  validateUpdateProject,
  validateCreateIssue,
  validateUpdateIssue,
};

