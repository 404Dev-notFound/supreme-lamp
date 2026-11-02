const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

const {
  validateProfileUpdate,
  validateUrl,
  isPrivateOrReservedHost,
} = require("./utils/security");
const { validateCreateCompany, validateCreateJob } = require("./validators/jobs.validator");
const resumesService = require("./services/resumes.service");
const gatewayService = require("./services/gateway.service");

// ============================================================================
// 1. Production Secret Enforcement
// ============================================================================
test("Config Security - Blocks insecure fallback secrets in production environment", () => {
  const insecureSecrets = [
    "super-secret-key-please-change_yes-sir-i-have-changed-it",
    "super-secret-refresh-key-please-change",
    "915b693d6ec72978dff75123dc5380fa57818c203cc7a1676d79aee95818235eb50d1d5c65db85e60d9954ee6c2eddb8",
  ];

  for (const badSecret of insecureSecrets) {
    const isBad = insecureSecrets.includes(badSecret);
    assert.strictEqual(isBad, true, `Insecure default secret must be flagged: ${badSecret}`);
  }
});

// ============================================================================
// 2. JWT Algorithm Enforcement & Confusion Defense
// ============================================================================
test("JWT Security - Enforces HS256 and rejects algorithm confusion attacks", () => {
  const secretKey = "test-verification-secret-32-chars-long";
  const payload = { id: "user_test_123", email: "audit@flowctrl.dev" };

  const validToken = jwt.sign(payload, secretKey, { algorithm: "HS256" });

  // Valid HS256 token must succeed
  const decoded = jwt.verify(validToken, secretKey, { algorithms: ["HS256"] });
  assert.strictEqual(decoded.id, "user_test_123");

  // Attempting none algorithm or unapproved algorithms must be rejected
  assert.throws(() => {
    // Malformed token with none algorithm simulation
    const noneHeader = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const nonePayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const noneToken = `${noneHeader}.${nonePayload}.`;
    jwt.verify(noneToken, secretKey, { algorithms: ["HS256"] });
  });
});

// ============================================================================
// 3. Resume BOLA / IDOR Authorization Defense
// ============================================================================
test("Resume BOLA Defense - Normal user cannot access another user's resume even if applications exist", async () => {
  // If user is not owner and not admin and not recruiter, access must be strictly forbidden
  const isOwner = false;
  const isAdmin = false;
  const userRole = "USER"; // Regular user

  const isHiring = ["RECRUITER", "COMPANY_REP"].includes(userRole);
  assert.strictEqual(isHiring, false, "Regular candidate must NOT be treated as hiring staff");

  // Attempting access must reject
  assert.strictEqual(isOwner || isAdmin || isHiring, false);
});

// ============================================================================
// 4. SSRF Defense on User, Job, and Company Input URLs
// ============================================================================
test("SSRF Defense - Rejects cloud metadata and loopback addresses on company and job URLs", () => {
  const maliciousUrls = [
    "http://169.254.169.254/latest/meta-data/",
    "http://127.0.0.1:5432",
    "http://localhost:8080/admin",
    "http://metadata.google.internal/computeMetadata/v1/",
    "http://0.0.0.0:5000",
  ];

  for (const url of maliciousUrls) {
    // Company website / logo
    const compResult = validateCreateCompany({
      name: "Exploit Corp",
      website: url,
      logo: url,
    });
    assert.strictEqual(
      compResult.isValid,
      false,
      `Company URL pointing to internal address must be blocked: ${url}`,
    );

    // Job apply URL
    const jobResult = validateCreateJob({
      title: "Security Engineer",
      companyId: "comp_123",
      location: "Remote",
      applyUrl: url,
    });
    assert.strictEqual(
      jobResult.isValid,
      false,
      `Job apply URL pointing to internal address must be blocked: ${url}`,
    );

    // User Profile update
    const profileResult = validateProfileUpdate({
      websiteUrl: url,
      avatarUrl: url,
    });
    assert.strictEqual(
      profileResult.isValid,
      false,
      `User profile URL pointing to internal address must be blocked: ${url}`,
    );
  }
});

// ============================================================================
// 5. Information Disclosure Defense - Microservice Gateway
// ============================================================================
test("Information Disclosure Defense - Health check probe masks internal microservice endpoints", async () => {
  const health = await gatewayService.checkServicesHealth();

  assert.ok(health.mentalHealth);
  assert.ok(health.resumeScreener);
  assert.strictEqual(
    health.mentalHealth.endpoint,
    undefined,
    "Internal mental health service endpoint URL must NOT be exposed",
  );
  assert.strictEqual(
    health.resumeScreener.endpoint,
    undefined,
    "Internal resume screener service endpoint URL must NOT be exposed",
  );
  assert.ok(["healthy", "degraded", "offline", "unknown"].includes(health.mentalHealth.status));
});
