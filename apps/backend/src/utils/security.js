/**
 * Security and Validation Utilities for flowCTRL Express Backend
 */

const DANGEROUS_SCHEMES = [
  "javascript:",
  "data:",
  "vbscript:",
  "file:",
  "blob:",
  "livescript:",
  "mocha:",
];

/**
 * Checks if a hostname or IP address resolves to a private, loopback, or cloud-metadata network.
 * Comprehensive protection against Server-Side Request Forgery (SSRF).
 */
function isPrivateOrReservedHost(hostname) {
  if (!hostname || typeof hostname !== "string") return true;

  const cleanHost = hostname.trim().toLowerCase().replace(/^\[|\]$/g, "");

  // Known local/internal domain names
  if (
    cleanHost === "localhost" ||
    cleanHost.endsWith(".localhost") ||
    cleanHost.endsWith(".local") ||
    cleanHost.endsWith(".internal") ||
    cleanHost.endsWith(".lan") ||
    cleanHost === "metadata.google.internal"
  ) {
    return true;
  }

  // IPv6 checks
  if (
    cleanHost === "::1" ||
    cleanHost === "::" ||
    cleanHost.startsWith("fe80:") || // link-local
    cleanHost.startsWith("fc00:") || // unique local
    cleanHost.startsWith("fd00:") || // unique local
    cleanHost.startsWith("::ffff:") // IPv4 mapped
  ) {
    return true;
  }

  // Check numeric representations (decimal IP, hex IP)
  let ipCandidate = cleanHost;
  if (/^\d+$/.test(cleanHost)) {
    const num = parseInt(cleanHost, 10);
    if (num >= 0 && num <= 4294967295) {
      ipCandidate = [
        (num >>> 24) & 255,
        (num >>> 16) & 255,
        (num >>> 8) & 255,
        num & 255,
      ].join(".");
    }
  } else if (/^0x[0-9a-f]+$/i.test(cleanHost)) {
    const num = parseInt(cleanHost, 16);
    if (num >= 0 && num <= 4294967295) {
      ipCandidate = [
        (num >>> 24) & 255,
        (num >>> 16) & 255,
        (num >>> 8) & 255,
        num & 255,
      ].join(".");
    }
  }

  // IPv4 Octet checks
  const ipv4Match = ipCandidate.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, a, b, c, d] = ipv4Match.map(Number);
    if (a > 255 || b > 255 || c > 255 || d > 255) return true;

    // 0.0.0.0/8 (Broadcast/Current)
    if (a === 0) return true;
    // 10.0.0.0/8 (RFC 1918 Private)
    if (a === 10) return true;
    // 127.0.0.0/8 (Loopback)
    if (a === 127) return true;
    // 169.254.0.0/16 (Link-local / AWS & GCP Cloud Metadata: 169.254.169.254)
    if (a === 169 && b === 254) return true;
    // 172.16.0.0/12 (RFC 1918 Private)
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.168.0.0/16 (RFC 1918 Private)
    if (a === 192 && b === 168) return true;
    // 100.64.0.0/10 (Shared Carrier NAT)
    if (a === 100 && b >= 64 && b <= 127) return true;
    // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
    if (a >= 224) return true;
  }

  return false;
}

function containsDangerousScheme(url) {
  if (!url || typeof url !== "string") return false;
  // Decode percent-encoded schemes to prevent %6a%61%76%61%73%63%72%69%70%74 bypasses
  let decoded = url;
  try {
    decoded = decodeURIComponent(url);
  } catch {
    decoded = url.replace(/%([0-9a-f]{2})/gi, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    );
  }
  const normalized = decoded.trim().toLowerCase().replace(/[\x00-\x20\s\u200B-\u200D\uFEFF]/g, "");
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

function validateUrl(url, fieldName = "URL", options = {}) {
  const { allowPrivate = true } = options;

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

    // SSRF Check: block private and cloud metadata addresses if allowPrivate is explicitly false
    if (!allowPrivate && isPrivateOrReservedHost(parsed.hostname)) {
      return {
        isValid: false,
        error: `${fieldName} points to a restricted or private internal address (SSRF protection).`,
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
  isPrivateOrReservedHost,
  validateProfileUpdate,
  sanitizeSelfProfile,
  sanitizePublicProfile,
  maskIpAddress,
};
