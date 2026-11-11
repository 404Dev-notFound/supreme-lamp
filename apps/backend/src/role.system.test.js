const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { prisma } = require("./lib/prisma");
const { createSessionRecord } = require("./utils/sessionCookie");

const BASE_URL = "http://localhost:5000";
const FRONTEND_URL = "http://localhost:3000";

function makeRequest({ path, method = "GET", headers = {}, body = null, baseUrl = BASE_URL }) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        Accept: "application/json",
        Origin: "http://localhost:3000",
        ...headers,
      },
    };

    if (body) {
      const payload = typeof body === "string" ? body : JSON.stringify(body);
      options.headers["Content-Type"] = "application/json";
      options.headers["Content-Length"] = Buffer.byteLength(payload);
    }

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed,
        });
      });
    });

    req.on("error", reject);

    if (body) {
      req.write(typeof body === "string" ? body : JSON.stringify(body));
    }
    req.end();
  });
}

describe("Strict Two-Role Authorization Architecture (USER vs ADMIN)", () => {
  let adminSessionToken;
  let userSessionToken;
  let adminUser;
  let normalUser;
  const testCsrfToken = "flowctrl_test_csrf_token_123456";

  before(async () => {
    // Fetch seed users from database
    adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true, email: true, role: true },
    });

    normalUser = await prisma.user.findFirst({
      where: { role: "USER" },
      select: { id: true, email: true, role: true },
    });

    assert.ok(adminUser, "Database must have at least one ADMIN user");
    assert.ok(normalUser, "Database must have at least one USER user");
    assert.equal(adminUser.role, "ADMIN");
    assert.equal(normalUser.role, "USER");

    // Create real DB session tokens
    const adminSession = await createSessionRecord(adminUser.id);
    adminSessionToken = adminSession.sessionToken;

    const userSession = await createSessionRecord(normalUser.id);
    userSessionToken = userSession.sessionToken;
  });

  after(async () => {
    // Clean up created test sessions
    if (adminSessionToken) {
      await prisma.userSession.deleteMany({ where: { sessionToken: adminSessionToken } });
    }
    if (userSessionToken) {
      await prisma.userSession.deleteMany({ where: { sessionToken: userSessionToken } });
    }
  });

  // -------------------------------------------------------------
  // Test 1: Role Consistency via /api/auth/me
  // -------------------------------------------------------------
  test("1. /api/auth/me accurately reports DB roles: ADMIN and USER", async () => {
    // Unauthenticated
    const guestRes = await makeRequest({ path: "/api/auth/me" });
    assert.equal(guestRes.statusCode, 200);
    assert.equal(guestRes.data.authenticated, false);
    assert.equal(guestRes.data.user, null);

    // USER role
    const userRes = await makeRequest({
      path: "/api/auth/me",
      headers: { Cookie: `flowctrl_session=${userSessionToken}` },
    });
    assert.equal(userRes.statusCode, 200);
    assert.equal(userRes.data.authenticated, true);
    assert.equal(userRes.data.user.role, "USER");
    assert.equal(userRes.data.user.email, normalUser.email);

    // ADMIN role
    const adminRes = await makeRequest({
      path: "/api/auth/me",
      headers: { Cookie: `flowctrl_session=${adminSessionToken}` },
    });
    assert.equal(adminRes.statusCode, 200);
    assert.equal(adminRes.data.authenticated, true);
    assert.equal(adminRes.data.user.role, "ADMIN");
    assert.equal(adminRes.data.user.email, adminUser.email);
  });

  // -------------------------------------------------------------
  // Test 2: Unauthenticated / Guest Access Matrix
  // -------------------------------------------------------------
  test("2. Unauthenticated requests to administrative endpoints return 401 Unauthorized", async () => {
    const endpoints = [
      { path: "/api/admin/stats", method: "GET" },
      { path: "/api/admin/audit-logs", method: "GET" },
      { path: "/api/admin/users", method: "GET" },
      { path: "/api/rag/admin/reindex", method: "POST", body: {} },
    ];

    for (const ep of endpoints) {
      const res = await makeRequest({
        path: ep.path,
        method: ep.method,
        body: ep.body,
      });

      assert.equal(
        res.statusCode,
        401,
        `Expected 401 for unauthenticated ${ep.method} ${ep.path}, got ${res.statusCode}`
      );
      assert.equal(res.data.code, "UNAUTHORIZED");
    }
  });

  // -------------------------------------------------------------
  // Test 3: Authenticated USER Access Matrix (Strict 403 Forbidden)
  // -------------------------------------------------------------
  test("3. Authenticated USER requests to administrative endpoints return 403 Forbidden", async () => {
    const endpoints = [
      { path: "/api/admin/stats", method: "GET" },
      { path: "/api/admin/audit-logs", method: "GET" },
      { path: "/api/admin/users", method: "GET" },
      { path: "/api/rag/admin/reindex", method: "POST", body: {} },
    ];

    for (const ep of endpoints) {
      const res = await makeRequest({
        path: ep.path,
        method: ep.method,
        headers: {
          Cookie: `flowctrl_session=${userSessionToken}; flowctrl_csrf=${testCsrfToken}`,
          "x-flowctrl-csrf": testCsrfToken,
        },
        body: ep.body,
      });

      assert.equal(
        res.statusCode,
        403,
        `Expected 403 for USER on ${ep.method} ${ep.path}, got ${res.statusCode}`
      );
      assert.equal(res.data.code, "FORBIDDEN");
    }
  });

  // -------------------------------------------------------------
  // Test 4: Authenticated ADMIN Access Matrix (Allowed)
  // -------------------------------------------------------------
  test("4. Authenticated ADMIN requests to administrative endpoints are authorized", async () => {
    // 4a. Admin stats
    const statsRes = await makeRequest({
      path: "/api/admin/stats",
      method: "GET",
      headers: { Cookie: `flowctrl_session=${adminSessionToken}` },
    });
    assert.equal(statsRes.statusCode, 200, "ADMIN should access /api/admin/stats");
    assert.ok(statsRes.data.data.users, "Stats must contain users overview");

    // 4b. Admin audit logs
    const auditRes = await makeRequest({
      path: "/api/admin/audit-logs",
      method: "GET",
      headers: { Cookie: `flowctrl_session=${adminSessionToken}` },
    });
    assert.equal(auditRes.statusCode, 200, "ADMIN should access /api/admin/audit-logs");
    assert.ok(Array.isArray(auditRes.data.data), "Audit logs must return array");

    // 4c. Admin user list
    const usersRes = await makeRequest({
      path: "/api/admin/users",
      method: "GET",
      headers: { Cookie: `flowctrl_session=${adminSessionToken}` },
    });
    assert.equal(usersRes.statusCode, 200, "ADMIN should access /api/admin/users");
    assert.ok(Array.isArray(usersRes.data.data), "User list must return array");
  });

  // -------------------------------------------------------------
  // Test 5: Reindex Authorization (ADMIN role + Admin Secret)
  // -------------------------------------------------------------
  test("5. Reindex API requires ADMIN role; rejects USER with 403, executes for ADMIN", async () => {
    // USER with service key header -> still rejected with 403 because role is USER
    const userWithSecretRes = await makeRequest({
      path: "/api/rag/admin/reindex",
      method: "POST",
      headers: {
        Cookie: `flowctrl_session=${userSessionToken}; flowctrl_csrf=${testCsrfToken}`,
        "x-flowctrl-csrf": testCsrfToken,
        "x-admin-key": "flowctrl-dev-admin-secret-2026",
      },
      body: { limit: 5 },
    });
    assert.equal(userWithSecretRes.statusCode, 403, "USER cannot bypass role check with service secret");
    assert.equal(userWithSecretRes.data.code, "FORBIDDEN");

    // ADMIN with valid service key -> Allowed (200)
    const adminValidRes = await makeRequest({
      path: "/api/rag/admin/reindex",
      method: "POST",
      headers: {
        Cookie: `flowctrl_session=${adminSessionToken}; flowctrl_csrf=${testCsrfToken}`,
        "x-flowctrl-csrf": testCsrfToken,
        "x-admin-key": "flowctrl-dev-admin-secret-2026",
      },
      body: { limit: 5 },
    });
    assert.equal(adminValidRes.statusCode, 200, "ADMIN with valid service key executes reindex");
    assert.equal(adminValidRes.data.success, true);
  });

  // -------------------------------------------------------------
  // Test 6: Role Validation Rejects Non-Existent Roles (e.g. SUPER_ADMIN)
  // -------------------------------------------------------------
  test("6. Role updates only accept 'USER' or 'ADMIN'; rejects 'SUPER_ADMIN', 'MENTOR', etc.", async () => {
    // Attempt to assign obsolete role "SUPER_ADMIN"
    const superAdminRes = await makeRequest({
      path: `/api/admin/users/${normalUser.id}/role`,
      method: "PATCH",
      headers: {
        Cookie: `flowctrl_session=${adminSessionToken}; flowctrl_csrf=${testCsrfToken}`,
        "x-flowctrl-csrf": testCsrfToken,
      },
      body: { role: "SUPER_ADMIN" },
    });
    assert.equal(superAdminRes.statusCode, 400, "Must reject SUPER_ADMIN as invalid role");

    // Attempt to assign obsolete role "MENTOR"
    const mentorRes = await makeRequest({
      path: `/api/admin/users/${normalUser.id}/role`,
      method: "PATCH",
      headers: {
        Cookie: `flowctrl_session=${adminSessionToken}; flowctrl_csrf=${testCsrfToken}`,
        "x-flowctrl-csrf": testCsrfToken,
      },
      body: { role: "MENTOR" },
    });
    assert.equal(mentorRes.statusCode, 400, "Must reject MENTOR as invalid role");

    // Attempt to assign valid role "USER"
    const validUserRes = await makeRequest({
      path: `/api/admin/users/${normalUser.id}/role`,
      method: "PATCH",
      headers: {
        Cookie: `flowctrl_session=${adminSessionToken}; flowctrl_csrf=${testCsrfToken}`,
        "x-flowctrl-csrf": testCsrfToken,
      },
      body: { role: "USER" },
    });
    assert.equal(validUserRes.statusCode, 200, "Must accept USER role");
    assert.equal(validUserRes.data.data.role, "USER");
  });

  // -------------------------------------------------------------
  // Test 7: Frontend /admin and NavProfile RBAC contract
  // -------------------------------------------------------------
  test("7. Frontend /admin and NavProfile RBAC contract", async () => {
    // Query Next.js /admin page
    const adminPageRes = await makeRequest({
      path: "/admin",
      method: "GET",
      baseUrl: FRONTEND_URL,
    });
    // Next.js serves the client page with HTTP 200
    assert.equal(adminPageRes.statusCode, 200);

    // Verify NavProfile and Admin Page source code enforces role === "ADMIN"
    const fs = require("node:fs");
    const navProfileCode = fs.readFileSync("apps/frontend/src/components/NavProfile.jsx", "utf-8");
    assert.ok(
      navProfileCode.includes('role === "ADMIN"'),
      "NavProfile must conditionally render admin menu only for role === 'ADMIN'"
    );
    assert.ok(
      !navProfileCode.includes("SUPER_ADMIN"),
      "NavProfile must not reference SUPER_ADMIN"
    );

    const adminPageCode = fs.readFileSync("apps/frontend/src/app/admin/page.jsx", "utf-8");
    assert.ok(
      adminPageCode.includes('user.role !== "ADMIN"'),
      "Admin page must restrict access when user.role !== 'ADMIN'"
    );
    assert.ok(
      adminPageCode.includes("403 — Access Denied"),
      "Admin page must display 403 Access Denied for non-ADMIN users"
    );
    assert.ok(
      adminPageCode.includes("401 — Authentication Required"),
      "Admin page must display 401 Authentication Required for unauthenticated users"
    );
  });
});
