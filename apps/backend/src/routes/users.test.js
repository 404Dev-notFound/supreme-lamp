const test = require("node:test");
const assert = require("node:assert");
const {
  isSafeUrl,
  validateUrl,
  validateProfileUpdate,
  sanitizePublicProfile,
  sanitizeSelfProfile,
  maskIpAddress,
} = require("../utils/security");

test("Security Utils - URL validation blocks dangerous schemes", () => {
  assert.strictEqual(isSafeUrl("javascript:alert(1)"), false);
  assert.strictEqual(isSafeUrl("JAVASCRIPT:alert(1)"), false);
  assert.strictEqual(isSafeUrl("data:text/html;base64,PHNjcmlwdD4="), false);
  assert.strictEqual(isSafeUrl("vbscript:msgbox(1)"), false);
  assert.strictEqual(isSafeUrl("file:///etc/passwd"), false);
  assert.strictEqual(isSafeUrl(""), false);
  assert.strictEqual(isSafeUrl(null), false);

  assert.strictEqual(isSafeUrl("https://flowctrl.dev"), true);
  assert.strictEqual(isSafeUrl("https://github.com/flowctrl"), true);
  assert.strictEqual(isSafeUrl("http://localhost:3000"), true);
});

test("Security Utils - validateUrl returns error message for unsafe protocols", () => {
  const result = validateUrl("javascript:alert('xss')", "Website");
  assert.strictEqual(result.isValid, false);
  assert.match(result.error, /insecure or disallowed protocol/);

  const safeResult = validateUrl("https://twitter.com/dev", "Twitter");
  assert.strictEqual(safeResult.isValid, true);
  assert.strictEqual(safeResult.sanitized, "https://twitter.com/dev");
});

test("Security Utils - validateProfileUpdate prevents mass assignment", () => {
  const maliciousPayload = {
    displayName: "Hacker User",
    headline: "Security Researcher",
    // Protected fields that must be ignored/dropped
    id: "hacked-id-123",
    role: "SUPER_ADMIN",
    status: "BANNED",
    email: "hacker@evil.com",
    password: "new-password-123",
    passwordHash: "fake-hash",
    websiteUrl: "https://example.com",
    githubUrl: "javascript:alert(1)", // Dangerous url
  };

  const { isValid, errors, sanitized } = validateProfileUpdate(maliciousPayload);

  // Dangerous URL should fail validation
  assert.strictEqual(isValid, false);
  assert.ok(errors.some((e) => e.includes("GitHub URL")));

  // Protected fields must not be present in sanitized output
  assert.strictEqual(sanitized.id, undefined);
  assert.strictEqual(sanitized.role, undefined);
  assert.strictEqual(sanitized.status, undefined);
  assert.strictEqual(sanitized.email, undefined);
  assert.strictEqual(sanitized.password, undefined);
  assert.strictEqual(sanitized.passwordHash, undefined);

  // Allowed fields preserved
  assert.strictEqual(sanitized.displayName, "Hacker User");
  assert.strictEqual(sanitized.headline, "Security Researcher");
  assert.strictEqual(sanitized.websiteUrl, "https://example.com/");
});

test("Security Utils - maskIpAddress coarsens IPv4 and IPv6", () => {
  assert.strictEqual(maskIpAddress("192.168.1.105"), "192.168.1.***");
  assert.strictEqual(maskIpAddress("::ffff:10.0.0.42"), "10.0.0.***");
  assert.strictEqual(maskIpAddress("2001:0db8:85a3:0000:0000:8a2e:0370:7334"), "2001:0db8:85a3:****:****");
  assert.strictEqual(maskIpAddress(""), "Unknown");
  assert.strictEqual(maskIpAddress(null), "Unknown");
});

test("Security Utils - sanitizePublicProfile prevents PII leakage", () => {
  const rawUser = {
    id: "user-123",
    name: "John Doe",
    email: "john@secret.org",
    role: "ADMIN",
    status: "ACTIVE",
    createdAt: new Date("2026-01-01"),
    profile: {
      displayName: "Johnny",
      headline: "Staff Engineer",
      bio: "Building systems",
      avatarUrl: "https://example.com/avatar.jpg",
      location: "San Francisco",
      websiteUrl: "https://johnny.dev",
      githubUrl: "https://github.com/johnny",
      linkedinUrl: "https://linkedin.com/in/johnny",
      twitterUrl: null,
    },
    preferences: {
      theme: "dark",
      emailNotifications: true,
      profileVisibility: "PUBLIC",
    },
    skills: [{ skill: { name: "TypeScript" } }, { skill: { name: "PostgreSQL" } }],
  };

  const publicData = sanitizePublicProfile(rawUser);

  // Public data must NOT contain email, role, status, or preferences
  assert.strictEqual(publicData.email, undefined);
  assert.strictEqual(publicData.role, undefined);
  assert.strictEqual(publicData.status, undefined);
  assert.strictEqual(publicData.preferences, undefined);

  // Safe fields preserved
  assert.strictEqual(publicData.id, "user-123");
  assert.strictEqual(publicData.name, "Johnny");
  assert.strictEqual(publicData.headline, "Staff Engineer");
  assert.deepStrictEqual(publicData.skills, ["TypeScript", "PostgreSQL"]);
});

test("Security Utils - sanitizeSelfProfile exposes preferences but never sensitive auth tokens", () => {
  const rawUser = {
    id: "user-123",
    name: "John Doe",
    email: "john@secret.org",
    password: "hashed-pw-secret",
    role: "USER",
    status: "ACTIVE",
    createdAt: new Date("2026-01-01"),
    profile: {
      displayName: "Johnny",
      headline: "Engineer",
    },
    preferences: {
      theme: "system",
      emailNotifications: false,
      weeklyDigest: true,
      jobAlerts: true,
      profileVisibility: "PUBLIC",
      careerGoalVisibility: "PUBLIC",
    },
    skills: [{ skill: { name: "Node.js" } }],
  };

  const selfData = sanitizeSelfProfile(rawUser);

  assert.strictEqual(selfData.password, undefined);
  assert.strictEqual(selfData.passwordHash, undefined);
  assert.strictEqual(selfData.email, "john@secret.org");
  assert.strictEqual(selfData.preferences.theme, "system");
  assert.deepStrictEqual(selfData.skills, ["Node.js"]);
});
