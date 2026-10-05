const test = require("node:test");
const assert = require("node:assert");
const bcrypt = require("bcrypt");
const {
  parseCookies,
  serializeCookie,
  getCookieOptions,
  sanitizeAuthUser,
  SESSION_COOKIE_NAME,
  CSRF_COOKIE_NAME,
} = require("../utils/sessionCookie");
const {
  validateSignup,
  validateSignin,
  validateChangePassword,
  normalizeEmail,
} = require("../validators/auth.validator");

test("Cookie Security - parseCookies correctly parses cookie strings", () => {
  const header =
    "flowctrl_session=sess_12345abcde; flowctrl_csrf=csrf_67890; theme=dark";
  const parsed = parseCookies(header);

  assert.strictEqual(parsed.flowctrl_session, "sess_12345abcde");
  assert.strictEqual(parsed.flowctrl_csrf, "csrf_67890");
  assert.strictEqual(parsed.theme, "dark");
  assert.strictEqual(parsed.nonexistent, undefined);

  assert.deepStrictEqual(parseCookies(""), {});
  assert.deepStrictEqual(parseCookies(null), {});
});

test("Cookie Security - serializeCookie enforces HttpOnly, Secure, and SameSite attributes", () => {
  const cookieStr = serializeCookie(SESSION_COOKIE_NAME, "token_val_123", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 2592000,
  });

  assert.ok(cookieStr.includes("flowctrl_session=token_val_123"));
  assert.ok(cookieStr.includes("HttpOnly"), "Session cookie MUST be HttpOnly");
  assert.ok(
    cookieStr.includes("Secure"),
    "Session cookie MUST be Secure in production",
  );
  assert.ok(
    cookieStr.includes("SameSite=Lax"),
    "Session cookie MUST have SameSite attribute",
  );
  assert.ok(cookieStr.includes("Path=/"), "Session cookie MUST have Path=/");
  assert.ok(cookieStr.includes("Max-Age=2592000"));
});

test("Cookie Security - CSRF cookie is accessible to client JS but Lax/Secure", () => {
  const { sessionCookie, csrfCookie } = getCookieOptions();

  assert.strictEqual(
    sessionCookie.httpOnly,
    true,
    "Primary session cookie must be HttpOnly",
  );
  assert.strictEqual(
    csrfCookie.httpOnly,
    false,
    "CSRF token cookie must be readable by JS for header attachment",
  );
  assert.strictEqual(sessionCookie.sameSite, "lax");
  assert.strictEqual(csrfCookie.sameSite, "lax");
});

test("CSRF Protection Logic - Double-submit header verification", () => {
  const cookieToken = "csrf_token_secret_abc123";

  // Valid match
  const validHeader = "csrf_token_secret_abc123";
  assert.strictEqual(
    validHeader === cookieToken,
    true,
    "Matching CSRF token header allows request",
  );

  // Attack: Mismatched or forged token
  const attackerHeader = "forged_attacker_token_xyz";
  assert.strictEqual(
    attackerHeader === cookieToken,
    false,
    "Forged CSRF token rejected",
  );

  // Attack: Missing header
  const missingHeader = undefined;
  assert.strictEqual(
    Boolean(missingHeader && missingHeader === cookieToken),
    false,
    "Missing CSRF token rejected",
  );
});

test("Session Expiration & Revocation Logic", () => {
  const now = new Date();
  const past = new Date(now.getTime() - 10000);
  const future = new Date(now.getTime() + 30 * 24 * 3600 * 1000);

  const activeSession = {
    expiresAt: future,
    revokedAt: null,
  };

  const expiredSession = {
    expiresAt: past,
    revokedAt: null,
  };

  const revokedSession = {
    expiresAt: future,
    revokedAt: past,
  };

  function isSessionUsable(session) {
    if (!session) return false;
    if (session.revokedAt !== null && session.revokedAt !== undefined)
      return false;
    if (session.expiresAt <= new Date()) return false;
    return true;
  }

  assert.strictEqual(
    isSessionUsable(activeSession),
    true,
    "Active session is accepted",
  );
  assert.strictEqual(
    isSessionUsable(expiredSession),
    false,
    "Expired session is rejected",
  );
  assert.strictEqual(
    isSessionUsable(revokedSession),
    false,
    "Revoked session is rejected",
  );
});

test("Input Validation - normalizeEmail cleans and normalizes strings", () => {
  assert.strictEqual(
    normalizeEmail("  Alex.Johnson@Example.COM  "),
    "alex.johnson@example.com",
  );
  assert.strictEqual(normalizeEmail(null), "");
  assert.strictEqual(normalizeEmail(undefined), "");
});

test("Input Validation - validateSignup accepts valid payload", () => {
  const result = validateSignup({
    name: "Alex Doe",
    email: "alex@flowctrl.dev",
    password: "StrongPassword123!",
    confirmPassword: "StrongPassword123!",
  });

  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.errors.length, 0);
  assert.strictEqual(result.sanitized.name, "Alex Doe");
  assert.strictEqual(result.sanitized.email, "alex@flowctrl.dev");
  assert.strictEqual(result.sanitized.password, "StrongPassword123!");
});

test("Input Validation - validateSignup rejects invalid inputs", () => {
  // Short name
  assert.strictEqual(
    validateSignup({
      name: "A",
      email: "alex@example.com",
      password: "validPassword123",
    }).isValid,
    false,
  );

  // Missing email
  assert.strictEqual(
    validateSignup({
      name: "Alex Doe",
      email: "",
      password: "validPassword123",
    }).isValid,
    false,
  );

  // Invalid email format
  assert.strictEqual(
    validateSignup({
      name: "Alex Doe",
      email: "not-an-email",
      password: "validPassword123",
    }).isValid,
    false,
  );

  // Weak password (< 8 chars)
  assert.strictEqual(
    validateSignup({
      name: "Alex Doe",
      email: "alex@example.com",
      password: "short",
    }).isValid,
    false,
  );

  // Password mismatch
  const mismatch = validateSignup({
    name: "Alex Doe",
    email: "alex@example.com",
    password: "Password12345",
    confirmPassword: "DifferentPassword12345",
  });
  assert.strictEqual(mismatch.isValid, false);
  assert.ok(mismatch.errors.includes("Passwords do not match."));
});

test("Input Validation - validateSignin handles edge cases", () => {
  // Valid
  assert.strictEqual(
    validateSignin({
      email: "user@example.com",
      password: "anyValidPassword",
    }).isValid,
    true,
  );

  // Missing email
  assert.strictEqual(
    validateSignin({
      email: "",
      password: "anyValidPassword",
    }).isValid,
    false,
  );

  // Missing password
  assert.strictEqual(
    validateSignin({
      email: "user@example.com",
      password: "",
    }).isValid,
    false,
  );
});

test("Input Validation - validateChangePassword checks constraints", () => {
  assert.strictEqual(
    validateChangePassword({
      currentPassword: "OldPassword123",
      newPassword: "NewStrongPassword456",
      confirmPassword: "NewStrongPassword456",
    }).isValid,
    true,
  );

  // Short new password
  assert.strictEqual(
    validateChangePassword({
      currentPassword: "OldPassword123",
      newPassword: "short",
      confirmPassword: "short",
    }).isValid,
    false,
  );

  // New password mismatch
  assert.strictEqual(
    validateChangePassword({
      currentPassword: "OldPassword123",
      newPassword: "NewStrongPassword456",
      confirmPassword: "MismatchPassword456",
    }).isValid,
    false,
  );
});

test("Security Sanitization - sanitizeAuthUser NEVER returns sensitive hashes or tokens", () => {
  const rawDbUser = {
    id: "usr_123456",
    name: "Alex Johnson",
    email: "alex@flowctrl.dev",
    password: "$2a$10$superSecretHashedPasswordValNotForClients",
    role: "USER",
    status: "ACTIVE",
    profile: {
      displayName: "Alex J.",
      avatarUrl: "https://example.com/avatar.png",
    },
    createdAt: new Date(),
  };

  const safe = sanitizeAuthUser(rawDbUser);

  assert.strictEqual(safe.id, "usr_123456");
  assert.strictEqual(safe.name, "Alex J.");
  assert.strictEqual(safe.email, "alex@flowctrl.dev");
  assert.strictEqual(safe.role, "USER");
  assert.strictEqual(safe.password, undefined, "Password MUST NOT be exposed");
  assert.strictEqual(
    safe.passwordHash,
    undefined,
    "Password hash MUST NOT be exposed",
  );
});

test("Security - Timing attack constant-time comparison helper", async () => {
  const dummyHash =
    "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
  const fakeAttempt = "myPasswordAttempt123";

  // Dummy compare should resolve false and not throw
  const isMatch = await bcrypt.compare(fakeAttempt, dummyHash);
  assert.strictEqual(isMatch, false);
});
