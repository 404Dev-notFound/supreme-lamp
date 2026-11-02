/**
 * Jobs, Companies & Applications Validators
 */

const { isSafeUrl, validateUrl } = require("../utils/security");

const VALID_WORK_MODES = ["REMOTE", "HYBRID", "ONSITE"];
const VALID_APPLICATION_STATUSES = [
  "APPLIED",
  "SCREENING",
  "INTERVIEWING",
  "OFFERED",
  "REJECTED",
  "WITHDRAWN",
];

function validateCreateCompany(body = {}) {
  const errors = [];
  const { name, logo, website, location, description } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    errors.push("Company name is required.");
  } else if (name.trim().length > 100) {
    errors.push("Company name must not exceed 100 characters.");
  }

  let cleanWebsite = null;
  if (website && typeof website === "string" && website.trim()) {
    const check = validateUrl(website.trim(), "Company website", { allowPrivate: false });
    if (!check.isValid) {
      errors.push(check.error);
    } else {
      cleanWebsite = check.sanitized;
    }
  }

  let cleanLogo = null;
  if (logo && typeof logo === "string" && logo.trim()) {
    const check = validateUrl(logo.trim(), "Company logo", { allowPrivate: false });
    if (!check.isValid) {
      errors.push(check.error);
    } else {
      cleanLogo = check.sanitized;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      name: name ? name.trim().slice(0, 100) : "",
      logo: cleanLogo,
      website: cleanWebsite,
      location: location ? String(location).trim().slice(0, 100) : null,
      description: description ? String(description).trim().slice(0, 2000) : null,
    },
  };
}

function validateCreateJob(body = {}) {
  const errors = [];
  const {
    title,
    companyId,
    location,
    workMode,
    salaryMin,
    salaryMax,
    currency,
    description,
    applyUrl,
    isFeatured,
    skills,
  } = body;

  if (!title || typeof title !== "string" || !title.trim()) {
    errors.push("Job title is required.");
  } else if (title.trim().length > 120) {
    errors.push("Job title must not exceed 120 characters.");
  }

  if (!companyId || typeof companyId !== "string" || !companyId.trim()) {
    errors.push("Company ID is required.");
  }

  if (!location || typeof location !== "string" || !location.trim()) {
    errors.push("Job location is required.");
  }

  const cleanWorkMode = VALID_WORK_MODES.includes(workMode) ? workMode : "REMOTE";

  let numMin = salaryMin !== undefined && salaryMin !== null ? parseInt(salaryMin, 10) : null;
  let numMax = salaryMax !== undefined && salaryMax !== null ? parseInt(salaryMax, 10) : null;

  if (numMin !== null && (isNaN(numMin) || numMin < 0)) {
    errors.push("Minimum salary must be a positive integer.");
  }
  if (numMax !== null && (isNaN(numMax) || numMax < 0)) {
    errors.push("Maximum salary must be a positive integer.");
  }
  if (numMin !== null && numMax !== null && numMin > numMax) {
    errors.push("Minimum salary cannot be greater than maximum salary.");
  }

  let cleanApplyUrl = null;
  if (applyUrl && typeof applyUrl === "string" && applyUrl.trim()) {
    const check = validateUrl(applyUrl.trim(), "Apply URL", { allowPrivate: false });
    if (!check.isValid) {
      errors.push(check.error);
    } else {
      cleanApplyUrl = check.sanitized;
    }
  }

  let parsedSkills = [];
  if (Array.isArray(skills)) {
    parsedSkills = skills
      .filter((s) => typeof s === "string" && s.trim())
      .map((s) => s.trim().slice(0, 50))
      .slice(0, 20);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      title: title ? title.trim().slice(0, 120) : "",
      companyId: companyId ? companyId.trim() : "",
      location: location ? location.trim().slice(0, 100) : "Remote",
      workMode: cleanWorkMode,
      salaryMin: numMin,
      salaryMax: numMax,
      currency: currency ? String(currency).trim().slice(0, 5).toUpperCase() : "USD",
      description: description ? String(description).trim().slice(0, 5000) : "",
      applyUrl: cleanApplyUrl,
      isFeatured: Boolean(isFeatured),
      skills: parsedSkills,
    },
  };
}

function validateJobApplication(body = {}) {
  const errors = [];
  const { resumeId, notes } = body;

  if (resumeId && typeof resumeId !== "string") {
    errors.push("Invalid resume identifier format.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      resumeId: resumeId ? String(resumeId).trim() : null,
      notes: notes ? String(notes).trim().slice(0, 1000) : null,
    },
  };
}

function validateApplicationStatus(body = {}) {
  const errors = [];
  const { status, notes } = body;

  if (!status || !VALID_APPLICATION_STATUSES.includes(status)) {
    errors.push(
      `Invalid application status. Must be one of: ${VALID_APPLICATION_STATUSES.join(", ")}`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      status,
      notes: notes ? String(notes).trim().slice(0, 1000) : undefined,
    },
  };
}

module.exports = {
  validateCreateCompany,
  validateCreateJob,
  validateJobApplication,
  validateApplicationStatus,
  VALID_WORK_MODES,
  VALID_APPLICATION_STATUSES,
};
