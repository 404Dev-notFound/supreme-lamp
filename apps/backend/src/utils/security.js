/**
 * Security and Validation Utilities for flowCTRL Express Backend
 */

const DANGEROUS_SCHEMES = ["javascript:", "data:", "vbscript:", "file:"];

function containsDangerousScheme(url) {
  if (!url || typeof url !== "string") return false;
  const normalized = url.trim().toLowerCase().replace(/[\x00-\x20\s]/g, "");
  return DANGEROUS_SCHEMES.some((scheme) => normalized.startsWith(scheme));
}

function isSafeUrl(url) {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (containsDangerousScheme(trimmed)) return false;

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function validateUrl(url, fieldName = "URL") {
  if (!url || typeof url !== "string" || !url.trim()) {
    return { isValid: true, sanitized: null };
  }

  const trimmed = url.trim();

  if (containsDangerousScheme(trimmed)) {
    return {
      isValid: false,
      error: `${fieldName} contains an insecure or disallowed protocol (e.g., javascript:, data:).`,
    };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return {
        isValid: false,
        error: `${fieldName} must use an http: or https: protocol.`,
      };
    }
    return { isValid: true, sanitized: parsed.href };
  } catch {
    return {
      isValid: false,
      error: `${fieldName} must be a valid, fully qualified URL.`,
    };
  }
}

const ALLOWED_PROFILE_FIELDS = [
  "name",
  "displayName",
  "firstName",
  "lastName",
  "headline",
  "bio",
  "avatarUrl",
  "location",
  "websiteUrl",
  "githubUrl",
  "linkedinUrl",
  "twitterUrl",
  "skills",
];

const PROTECTED_FIELDS = [
  "id",
  "userId",
  "email",
  "password",
  "passwordHash",
  "role",
  "status",
  "emailVerified",
  "createdAt",
  "updatedAt",
];

function validateProfileUpdate(body) {
  const errors = [];
  const sanitized = {};

  if (!body || typeof body !== "object") {
    return { isValid: false, errors: ["Invalid request body."], sanitized: {} };
  }

  for (const field of Object.keys(body)) {
    if (PROTECTED_FIELDS.includes(field)) {
      // Ignored or flagged to prevent mass assignment
      continue;
    }
    if (ALLOWED_PROFILE_FIELDS.includes(field)) {
      sanitized[field] = body[field];
    }
  }

  if (sanitized.displayName !== undefined) {
    if (typeof sanitized.displayName !== "string") {
      errors.push("displayName must be a string.");
    } else {
      sanitized.displayName = sanitized.displayName.trim().slice(0, 80);
    }
  }

  if (sanitized.headline !== undefined) {
    if (typeof sanitized.headline !== "string") {
      errors.push("headline must be a string.");
    } else {
      sanitized.headline = sanitized.headline.trim().slice(0, 160);
    }
  }

  if (sanitized.bio !== undefined) {
    if (typeof sanitized.bio !== "string") {
      errors.push("bio must be a string.");
    } else {
      sanitized.bio = sanitized.bio.trim().slice(0, 1000);
    }
  }

  if (sanitized.location !== undefined) {
    if (typeof sanitized.location !== "string") {
      errors.push("location must be a string.");
    } else {
      sanitized.location = sanitized.location.trim().slice(0, 100);
    }
  }

  const urlFields = [
    { key: "avatarUrl", label: "Avatar URL" },
    { key: "websiteUrl", label: "Website URL" },
    { key: "githubUrl", label: "GitHub URL" },
    { key: "linkedinUrl", label: "LinkedIn URL" },
    { key: "twitterUrl", label: "Twitter / X URL" },
  ];

  for (const { key, label } of urlFields) {
    if (sanitized[key]) {
      const urlCheck = validateUrl(sanitized[key], label);
      if (!urlCheck.isValid) {
        errors.push(urlCheck.error);
      } else {
        sanitized[key] = urlCheck.sanitized;
      }
    }
  }

  if (sanitized.skills !== undefined) {
    if (!Array.isArray(sanitized.skills)) {
      errors.push("skills must be an array of skill names.");
    } else {
      sanitized.skills = sanitized.skills
        .filter((s) => typeof s === "string" && s.trim())
        .map((s) => s.trim().slice(0, 50))
        .slice(0, 30);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized,
  };
}

function sanitizeSelfProfile(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    profile: user.profile
      ? {
          displayName: user.profile.displayName,
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          headline: user.profile.headline,
          bio: user.profile.bio,
          avatarUrl: user.profile.avatarUrl,
          location: user.profile.location,
          websiteUrl: user.profile.websiteUrl,
          githubUrl: user.profile.githubUrl,
          linkedinUrl: user.profile.linkedinUrl,
          twitterUrl: user.profile.twitterUrl,
          updatedAt: user.profile.updatedAt,
        }
      : null,
    preferences: user.preferences
      ? {
          theme: user.preferences.theme,
          emailNotifications: user.preferences.emailNotifications,
          weeklyDigest: user.preferences.weeklyDigest,
          jobAlerts: user.preferences.jobAlerts,
          profileVisibility: user.preferences.profileVisibility,
          careerGoalVisibility: user.preferences.careerGoalVisibility,
        }
      : null,
    skills: Array.isArray(user.userSkills || user.skills)
      ? (user.userSkills || user.skills).map((us) => (us.skill ? us.skill.name : us))
      : [],
  };
}

function sanitizePublicProfile(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.profile?.displayName || user.name,
    headline: user.profile?.headline || null,
    bio: user.profile?.bio || null,
    avatarUrl: user.profile?.avatarUrl || null,
    location: user.profile?.location || null,
    websiteUrl: user.profile?.websiteUrl || null,
    githubUrl: user.profile?.githubUrl || null,
    linkedinUrl: user.profile?.linkedinUrl || null,
    twitterUrl: user.profile?.twitterUrl || null,
    skills: Array.isArray(user.userSkills || user.skills)
      ? (user.userSkills || user.skills).map((us) => (us.skill ? us.skill.name : us))
      : [],
    createdAt: user.createdAt,
  };
}

function maskIpAddress(ip) {
  if (!ip || typeof ip !== "string") return "Unknown";
  const cleaned = ip.replace(/^::ffff:/, "");
  if (cleaned.includes(".")) {
    const parts = cleaned.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.***`;
    }
  }
  if (cleaned.includes(":")) {
    const parts = cleaned.split(":");
    return parts.slice(0, 3).join(":") + ":****:****";
  }
  return cleaned;
}

module.exports = {
  isSafeUrl,
  validateUrl,
  validateProfileUpdate,
  sanitizeSelfProfile,
  sanitizePublicProfile,
  maskIpAddress,
};
