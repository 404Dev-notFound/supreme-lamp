const test = require("node:test");
const assert = require("node:assert");
const bcrypt = require("bcrypt");
const {
  isSafeUrl,
  validateUrl,
  isPrivateOrReservedHost,
  validateProfileUpdate,
  sanitizePublicProfile,
  sanitizeSelfProfile,
} = require("./utils/security");
const {
  prototypePollutionGuard,
  hppGuard,
  hostHeaderGuard,
} = require("./middleware/security.middleware");
const { csrfProtection } = require("./middleware/csrf");
const { createRateLimiter } = require("./middleware/rateLimit.middleware");
const { errorHandler } = require("./middleware/error.middleware");
const { sanitizeAuthUser, CSRF_COOKIE_NAME } = require("./utils/sessionCookie");
const { validateSignup, validateSignin } = require("./validators/auth.validator");

// =========================================================================
// 1. SQL Injection & Input Validation Defense
// =========================================================================
test("SQL Injection Defense - Auth validators reject SQL injection payloads in email", () => {
  const sqlPayloads = [
    "' OR '1'='1",
    "admin' --",
    "'; DROP TABLE \"User\"; --",
    "' UNION SELECT id, password FROM \"User\" --",
    "user@example.com' OR '1'='1",
  ];

  for (const payload of sqlPayloads) {
    const signupResult = validateSignup({
      name: "Normal Name",
      email: payload,
      password: "ValidPassword123!",
    });
    assert.strictEqual(
      signupResult.isValid,
      false,
      `Payload should be rejected: ${payload}`,
    );
    assert.ok(signupResult.errors.some((e) => e.includes("valid email")));

    const signinResult = validateSignin({
      email: payload,
      password: "ValidPassword123!",
    });
    assert.strictEqual(signinResult.isValid, false);
  }
});

// =========================================================================
// 2. Prototype Pollution & NoSQL Injection Defense
// =========================================================================
test("Prototype Pollution Defense - prototypePollutionGuard cleans and blocks malicious keys", () => {
  // Test __proto__ injection
  const maliciousReq = {
    body: JSON.parse('{"name":"Test","__proto__":{"isAdmin":true}}'),
    query: {},
    params: {},
  };

  let nextCalled = false;
  let status = null;
  let responseData = null;

  const mockRes = {
    status: (s) => {
      status = s;
      return {
        json: (data) => {
          responseData = data;
        },
      };
    },
  };

  prototypePollutionGuard(maliciousReq, mockRes, () => {
    nextCalled = true;
  });

  // Verify it blocked the payload with 400
  assert.strictEqual(status, 400);
  assert.strictEqual(responseData.code, "INVALID_PAYLOAD");
  assert.strictEqual(Object.prototype.isAdmin, undefined);

  // Test constructor.prototype pollution
  const constructorReq = {
    body: JSON.parse('{"constructor":{"prototype":{"polluted":true}}}'),
    query: {},
    params: {},
  };

  prototypePollutionGuard(constructorReq, mockRes, () => {});
  assert.strictEqual(Object.prototype.polluted, undefined);

  // Clean request must pass cleanly
  let cleanNext = false;
  const cleanReq = {
    body: { name: "Clean User", skills: ["React", "Node"] },
    query: { page: "1" },
    params: { id: "user-123" },
  };

  prototypePollutionGuard(cleanReq, mockRes, () => {
    cleanNext = true;
  });
  assert.strictEqual(cleanNext, true);
});

// =========================================================================
// 3. XSS Defense (Stored, Reflected, Dangerous Schemes)
// =========================================================================
test("XSS Defense - Comprehensive blocking of obfuscated script and dangerous schemes", () => {
  const xssPayloads = [
    "javascript:alert(1)",
    "JAVASCRIPT:alert(document.cookie)",
    "java\tscript:alert(1)",
    "javascript://%0aalert(1)",
    "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
    "blob:https://example.com/uuid",
    "livescript:alert(1)",
    "mocha:alert(1)",
    "javascript:/*--></title></style></textarea>*/<script>alert(1)</script>",
  ];

  for (const url of xssPayloads) {
    assert.strictEqual(
      isSafeUrl(url),
      false,
      `Dangerous scheme must be rejected: ${url}`,
    );

    const validation = validateUrl(url, "Portfolio");
    assert.strictEqual(validation.isValid, false);
    assert.ok(validation.error.includes("insecure or disallowed protocol"));
  }
});

// =========================================================================
// 4. Server-Side Request Forgery (SSRF) Defense
// =========================================================================
test("SSRF Defense - Blocks private IP ranges, loopbacks, and cloud metadata services", () => {
  const ssrfHosts = [
    // Loopback
    "localhost",
    "127.0.0.1",
    "127.0.0.2",
    "127.255.255.254",
    "[::1]",
    // Cloud Metadata Endpoints (AWS, GCP, Azure, DigitalOcean)
    "169.254.169.254",
    "metadata.google.internal",
    // RFC 1918 Private Ranges
    "10.0.0.1",
    "10.254.0.1",
    "172.16.0.1",
    "172.24.1.1",
    "172.31.255.254",
    "192.168.0.1",
    "192.168.1.105",
    // Zero address
    "0.0.0.0",
    // Encoded integer IP bypasses (2130706433 is 127.0.0.1)
    "2130706433",
    "0x7f000001",
    // Internal TLDs
    "server.local",
    "internal.lan",
    "db.internal",
  ];

  for (const host of ssrfHosts) {
    assert.strictEqual(
      isPrivateOrReservedHost(host),
      true,
      `Private or reserved host must be detected: ${host}`,
    );

    const testUrl = `http://${host}/api/secret`;
    const check = validateUrl(testUrl, "Webhook", { allowPrivate: false });
    assert.strictEqual(
      check.isValid,
      false,
      `SSRF URL must be blocked: ${testUrl}`,
    );
    assert.ok(check.error.includes("SSRF protection"));
  }

  // Public legitimate websites must NOT be blocked
  assert.strictEqual(isPrivateOrReservedHost("flowctrl.dev"), false);
  assert.strictEqual(isPrivateOrReservedHost("github.com"), false);
  assert.strictEqual(isPrivateOrReservedHost("api.openai.com"), false);
});

// =========================================================================
// 5. Host Header Injection Defense
// =========================================================================
test("Host Header Defense - hostHeaderGuard validates host integrity", () => {
  let status = null;
  let responseData = null;
  const mockRes = {
    status: (s) => {
      status = s;
      return { json: (d) => (responseData = d) };
    },
  };

  // Missing Host
  let nextCalled = false;
  hostHeaderGuard({ headers: {} }, mockRes, () => (nextCalled = true));
  assert.strictEqual(status, 400);
  assert.strictEqual(responseData.code, "INVALID_HOST");

  // CRLF injection attempt
  status = null;
  hostHeaderGuard(
    { headers: { host: "localhost:5000\r\nX-Injected: evil" } },
    mockRes,
    () => {},
  );
  assert.strictEqual(status, 400);

  // Legitimate host
  nextCalled = false;
  hostHeaderGuard({ headers: { host: "localhost:5000" } }, mockRes, () => {
    nextCalled = true;
  });
  assert.strictEqual(nextCalled, true);
});

// =========================================================================
// 6. HTTP Parameter Pollution (HPP) Defense
// =========================================================================
test("HPP Defense - hppGuard collapses duplicate query parameters to single scalar", () => {
  const guard = hppGuard({ whitelist: ["skills"] });

  const pollutedReq = {
    query: {
      search: ["first_query", "second_query"],
      category: ["cat1", "cat2"],
      skills: ["React", "Node.js"], // Whitelisted as array
    },
  };

  guard(pollutedReq, {}, () => {});

  // Scalar parameters must be collapsed
  assert.strictEqual(typeof pollutedReq.query.search, "string");
  assert.strictEqual(pollutedReq.query.search, "second_query");
  assert.strictEqual(typeof pollutedReq.query.category, "string");

  // Whitelisted parameter remains an array
  assert.ok(Array.isArray(pollutedReq.query.skills));
});

// =========================================================================
// 7. CSRF Defense (Double-Submit Token & Origin)
// =========================================================================
test("CSRF Defense - csrfProtection enforces origin validation and token matching", () => {
  let status = null;
  let responseData = null;
  const mockRes = {
    status: (s) => {
      status = s;
      return { json: (d) => (responseData = d) };
    },
  };

  // Safe method (GET) should bypass CSRF check
  let nextCalled = false;
  csrfProtection({ method: "GET", headers: {} }, mockRes, () => {
    nextCalled = true;
  });
  assert.strictEqual(nextCalled, true);

  // Mutating method with untrusted origin must fail
  nextCalled = false;
  csrfProtection(
    {
      method: "POST",
      headers: {
        origin: "https://evil-phishing-site.com",
      },
    },
    mockRes,
    () => (nextCalled = true),
  );
  assert.strictEqual(status, 403);
  assert.strictEqual(responseData.code, "CSRF_FAILED");

  // Mutating method with matching CSRF cookie and header from valid origin must pass
  nextCalled = false;
  const validCsrf = "csrf_token_secret_1234567890";
  csrfProtection(
    {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
        cookie: `${CSRF_COOKIE_NAME}=${validCsrf}`,
        "x-flowctrl-csrf": validCsrf,
      },
    },
    mockRes,
    () => (nextCalled = true),
  );
  assert.strictEqual(nextCalled, true);
});

// =========================================================================
// 8. IDOR / BOLA Authorization Enforcement
// =========================================================================
test("IDOR / BOLA Defense - User profile update prevents mass assignment of administrative fields", () => {
  const maliciousPayload = {
    displayName: "Security Tester",
    headline: "Full Stack Engineer",
    // Attacker tries to elevate role or change status via IDOR mass-assignment
    id: "different-user-id-999",
    userId: "admin-id-001",
    role: "SUPER_ADMIN",
    status: "BANNED",
    email: "ceo@flowctrl.dev",
    password: "new-password",
  };

  const { isValid, sanitized } = validateProfileUpdate(maliciousPayload);

  assert.strictEqual(isValid, true);
  // Administrative and identity fields MUST be completely dropped
  assert.strictEqual(sanitized.id, undefined);
  assert.strictEqual(sanitized.userId, undefined);
  assert.strictEqual(sanitized.role, undefined);
  assert.strictEqual(sanitized.status, undefined);
  assert.strictEqual(sanitized.email, undefined);
  assert.strictEqual(sanitized.password, undefined);

  // Allowed fields preserved cleanly
  assert.strictEqual(sanitized.displayName, "Security Tester");
  assert.strictEqual(sanitized.headline, "Full Stack Engineer");
});

// =========================================================================
// 9. Sensitive Information Disclosure Defense
// =========================================================================
test("Information Disclosure Defense - PII, password hashes, and database internals are scrubbed", () => {
  const sensitiveUser = {
    id: "user-12345",
    name: "Jane Engineer",
    email: "jane@flowctrl.dev",
    password: "$2a$10$abcdefghijklmnopqrstuvwxyz1234567890", // Hash
    role: "USER",
    status: "ACTIVE",
    emailVerified: new Date(),
    profile: {
      displayName: "Jane",
      bio: "Software Architect",
      avatarUrl: "https://images.unsplash.com/photo-123",
      location: "San Francisco",
    },
    preferences: {
      theme: "dark",
      profileVisibility: "PUBLIC",
    },
  };

  // 1. Auth DTO sanitization
  const authSanitized = sanitizeAuthUser(sensitiveUser);
  assert.strictEqual(authSanitized.password, undefined);
  assert.strictEqual(authSanitized.email, "jane@flowctrl.dev");

  // 2. Public profile sanitization (must scrub email)
  const publicSanitized = sanitizePublicProfile(sensitiveUser);
  assert.strictEqual(publicSanitized.email, undefined);
  assert.strictEqual(publicSanitized.password, undefined);
  assert.strictEqual(publicSanitized.role, undefined);

  // 3. Error handler Prisma error mapping (never leak table names or SQL)
  let errorStatus = null;
  let errorData = null;
  const mockErrorRes = {
    status: (s) => {
      errorStatus = s;
      return { json: (d) => (errorData = d) };
    },
  };

  const prismaUniqueError = {
    code: "P2002",
    message: "Unique constraint failed on the fields: (`email`) in table `User`",
  };

  errorHandler(
    prismaUniqueError,
    { method: "POST", url: "/api/auth/signup" },
    mockErrorRes,
    () => {},
  );

  assert.strictEqual(errorStatus, 409);
  assert.strictEqual(errorData.code, "RESOURCE_CONFLICT");
  assert.strictEqual(
    errorData.error,
    "A record with this identifier already exists.",
  );
  // Verify table and column names were NOT exposed to the client
  assert.strictEqual(errorData.error.includes("table `User`"), false);
  assert.strictEqual(errorData.error.includes("(`email`)"), false);
});

// =========================================================================
// 10. Rate Limiting Protection
// =========================================================================
test("Rate Limiting Defense - createRateLimiter throttles brute-force attempts", () => {
  const limiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 3,
    message: "Rate limit exceeded for testing.",
  });

  const req = {
    baseUrl: "/api/auth",
    path: "/signin",
    ip: "198.51.100.5",
    headers: { "x-test-rate-limit": "true" },
  };

  const res = {
    headers: {},
    setHeader(key, value) {
      this.headers[key] = value;
    },
    status(code) {
      this.statusCode = code;
      return {
        json: (data) => {
          this.body = data;
        },
      };
    },
  };

  let passes = 0;
  // Make 3 allowed requests
  for (let i = 0; i < 3; i++) {
    limiter(req, res, () => {
      passes++;
    });
  }
  assert.strictEqual(passes, 3);
  assert.strictEqual(res.headers["X-RateLimit-Remaining"], 0);

  // 4th request must be throttled with HTTP 429
  let throttled = false;
  limiter(req, res, () => {
    throttled = true;
  });
  assert.strictEqual(throttled, false);
  assert.strictEqual(res.statusCode, 429);
  assert.strictEqual(res.body.code, "RATE_LIMIT_EXCEEDED");
});
