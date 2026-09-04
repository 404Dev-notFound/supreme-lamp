/**
 * flowCTRL Profile Validation, Mass-Assignment Protection & DTO Sanitization
 * --------------------------------------------------------------------------
 * Protects against mass assignment, privilege escalation, IDOR, and PII leakage.
 */

import { validateUrl, sanitizeSafeUrl } from "./urlSecurity";

export const ALLOWED_PROFILE_FIELDS = [
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

export const PROTECTED_FIELDS = [
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
  "accounts",
  "sessions",
  "userSessions",
  "securityLogs",
];

/**
 * Validates and sanitizes a profile update payload.
 * Strictly ignores or rejects protected/administrative attributes.
 */
export function validateProfileUpdate(payload) {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new Error("Request body must be a valid JSON object.");
  }

  const sanitized = {};

  // Display Name / Name
  const rawName = payload.displayName || payload.name;
  if (rawName !== undefined) {
    if (typeof rawName !== "string" || rawName.trim().length < 2) {
      throw new Error("Name must be at least 2 characters long.");
    }
    if (rawName.trim().length > 80) {
      throw new Error("Name cannot exceed 80 characters.");
    }
    sanitized.displayName = rawName.trim();
    sanitized.name = rawName.trim();
  }

  // Headline
  if (payload.headline !== undefined) {
    if (typeof payload.headline !== "string") {
      throw new Error("Headline must be a string.");
    }
    sanitized.headline = payload.headline.trim().slice(0, 120);
  }

  // Bio
  if (payload.bio !== undefined) {
    if (typeof payload.bio !== "string") {
      throw new Error("Bio must be a string.");
    }
    sanitized.bio = payload.bio.trim().slice(0, 2000);
  }

  // Location
  if (payload.location !== undefined) {
    if (typeof payload.location !== "string") {
      throw new Error("Location must be a string.");
    }
    sanitized.location = payload.location.trim().slice(0, 100);
  }

  // Avatar URL
  if (payload.avatarUrl !== undefined) {
    const avatarCheck = validateUrl(payload.avatarUrl, { allowEmpty: true });
    if (!avatarCheck.valid) {
      throw new Error(avatarCheck.error || "Invalid Avatar URL.");
    }
    sanitized.avatarUrl = avatarCheck.url || "";
  }

  // Portfolio Links (Website, GitHub, LinkedIn, Twitter)
  const urlFields = ["websiteUrl", "githubUrl", "linkedinUrl", "twitterUrl"];
  for (const field of urlFields) {
    if (payload[field] !== undefined) {
      const check = validateUrl(payload[field], { allowEmpty: true });
      if (!check.valid) {
        throw new Error(check.error || `Invalid URL for ${field}.`);
      }
      sanitized[field] = check.url || "";
    }
  }

  // Skills
  if (payload.skills !== undefined) {
    if (!Array.isArray(payload.skills)) {
      throw new Error("Skills must be an array.");
    }

    const cleanSkills = [];
    const seen = new Set();

    for (const item of payload.skills.slice(0, 30)) {
      if (!item || typeof item !== "object") continue;
      const rawName = typeof item.name === "string" ? item.name.trim() : "";
      if (!rawName || rawName.length > 60) continue;

      const lower = rawName.toLowerCase();
      if (seen.has(lower)) continue;
      seen.add(lower);

      const category =
        typeof item.category === "string" && item.category.trim().length > 0
          ? item.category.trim().slice(0, 50)
          : "General";

      const rawProf =
        typeof item.proficiency === "number"
          ? item.proficiency
          : parseInt(String(item.proficiency), 10);

      const proficiency = isNaN(rawProf)
        ? 3
        : Math.min(5, Math.max(1, rawProf));

      cleanSkills.push({
        name: rawName,
        category,
        proficiency,
      });
    }

    sanitized.skills = cleanSkills;
  }

  return sanitized;
}

/**
 * Sanitizes full user profile for the authenticated owner.
 * Preserves private email, preferences, skills, and roadmaps.
 */
export function sanitizeSelfProfile(user) {
  if (!user) return null;

  const profile = user.profile || {};
  const preferences = user.preferences || {};

  return {
    id: String(user.id),
    name: profile.displayName || user.name || "FlowCTRL User",
    displayName: profile.displayName || user.name || "FlowCTRL User",
    email: user.email,
    role: user.role || "USER",
    status: user.status || "ACTIVE",
    emailVerified: user.emailVerified,
    image: sanitizeSafeUrl(profile.avatarUrl || user.image || "", ""),
    avatarUrl: sanitizeSafeUrl(profile.avatarUrl || user.image || "", ""),
    headline: profile.headline || user.headline || "",
    bio: profile.bio || user.bio || "",
    location: profile.location || user.location || "",
    websiteUrl: sanitizeSafeUrl(profile.websiteUrl || "", ""),
    githubUrl: sanitizeSafeUrl(profile.githubUrl || "", ""),
    linkedinUrl: sanitizeSafeUrl(profile.linkedinUrl || "", ""),
    twitterUrl: sanitizeSafeUrl(profile.twitterUrl || "", ""),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    preferences: {
      theme: preferences.theme || "dark",
      emailNotifications: preferences.emailNotifications ?? true,
      weeklyDigest: preferences.weeklyDigest ?? true,
      jobAlerts: preferences.jobAlerts ?? true,
      profileVisibility: preferences.profileVisibility || "PUBLIC",
      careerGoalVisibility: preferences.careerGoalVisibility ?? true,
    },
    skills: (user.userSkills || []).map((us) => ({
      id: us.skillId,
      userSkillId: us.id,
      name: us.skill?.name || "Skill",
      category: us.skill?.category || "General",
      proficiency: us.proficiency,
      isVerified: us.isVerified,
    })),
    roadmaps: (user.roadmaps || []).map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category,
      isPublic: r.isPublic,
      updatedAt: r.updatedAt,
    })),
  };
}

/**
 * Sanitizes public profile for external visitors.
 * Strictly removes all PII (email, phone, sessions, security logs).
 */
export function sanitizePublicProfile(user) {
  if (!user) return null;

  const profile = user.profile || {};
  const preferences = user.preferences || {};

  // Check profile visibility preference
  const isPrivate = preferences.profileVisibility === "PRIVATE";
  if (isPrivate) {
    return {
      id: String(user.id),
      name: "Private Profile",
      isPrivate: true,
    };
  }

  return {
    id: String(user.id),
    name: profile.displayName || user.name || "Developer",
    avatarUrl: sanitizeSafeUrl(profile.avatarUrl || user.image || "", ""),
    headline: profile.headline || user.headline || "",
    bio: profile.bio || user.bio || "",
    location: profile.location || user.location || "",
    websiteUrl: sanitizeSafeUrl(profile.websiteUrl || "", ""),
    githubUrl: sanitizeSafeUrl(profile.githubUrl || "", ""),
    linkedinUrl: sanitizeSafeUrl(profile.linkedinUrl || "", ""),
    twitterUrl: sanitizeSafeUrl(profile.twitterUrl || "", ""),
    createdAt: user.createdAt,
    skills: (user.userSkills || []).map((us) => ({
      id: us.skillId,
      name: us.skill?.name || "Skill",
      category: us.skill?.category || "General",
      proficiency: us.proficiency,
    })),
    roadmaps: (user.roadmaps || [])
      .filter((r) => r.isPublic)
      .map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        category: r.category,
      })),
  };
}

/**
 * Coarsens IP addresses for safe display in session security views.
 * Example: 192.168.1.105 -> 192.168.1.xxx
 */
export function maskIpAddress(ip) {
  if (!ip || typeof ip !== "string") return "Unknown IP";
  const trimmed = ip.trim();

  // IPv4
  if (trimmed.includes(".")) {
    const parts = trimmed.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
    }
  }

  // IPv6
  if (trimmed.includes(":")) {
    const parts = trimmed.split(":");
    return `${parts.slice(0, 3).join(":")}:xxxx`;
  }

  return "Masked IP";
}

/**
 * Parses user agent string into human-readable device, browser, and OS names.
 */
export function parseUserAgent(ua) {
  if (!ua || typeof ua !== "string") {
    return { browser: "Browser", os: "Unknown OS", deviceType: "Desktop" };
  }

  const u = ua.toLowerCase();

  let browser = "Web Browser";
  if (u.includes("edg/") || u.includes("edge/")) browser = "Microsoft Edge";
  else if (u.includes("chrome/") || u.includes("crios/")) browser = "Google Chrome";
  else if (u.includes("firefox/") || u.includes("fxios/")) browser = "Mozilla Firefox";
  else if (u.includes("safari/") && !u.includes("chrome")) browser = "Apple Safari";
  else if (u.includes("opera/") || u.includes("opr/")) browser = "Opera";

  let os = "Unknown OS";
  let deviceType = "Desktop";

  if (u.includes("iphone")) {
    os = "iOS";
    deviceType = "Mobile";
  } else if (u.includes("ipad")) {
    os = "iPadOS";
    deviceType = "Tablet";
  } else if (u.includes("android")) {
    os = "Android";
    deviceType = u.includes("mobile") ? "Mobile" : "Tablet";
  } else if (u.includes("windows")) {
    os = "Windows";
    deviceType = "Desktop";
  } else if (u.includes("macintosh") || u.includes("mac os")) {
    os = "macOS";
    deviceType = "Desktop";
  } else if (u.includes("linux")) {
    os = "Linux";
    deviceType = "Desktop";
  }

  return { browser, os, deviceType };
}
