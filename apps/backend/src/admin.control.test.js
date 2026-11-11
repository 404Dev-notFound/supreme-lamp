const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { prisma } = require("./lib/prisma");
const { createSessionRecord } = require("./utils/sessionCookie");

const BASE_URL = "http://localhost:5000";

function makeRequest({ path, method = "GET", headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
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

describe("Admin Control Center — End-to-End Operational Verification", () => {
  let adminUser;
  let targetUser;
  let adminSessionToken;
  let userSessionToken;
  const testCsrfToken = "csrf_token_admin_control_test_2026";

  before(async () => {
    // 1. Fetch admin user
    adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true, email: true, role: true },
    });
    assert.ok(adminUser, "Database must have an admin user");

    // 2. Fetch or create a dedicated target user for mutation testing
    targetUser = await prisma.user.findFirst({
      where: { email: "alex@flowctrl.dev" },
      select: { id: true, email: true, role: true, status: true },
    });
    assert.ok(targetUser, "Target user alex@flowctrl.dev must exist in seed");

    // 3. Create real DB session tokens
    const adminSession = await createSessionRecord(adminUser.id);
    adminSessionToken = adminSession.sessionToken;

    const userSession = await createSessionRecord(targetUser.id);
    userSessionToken = userSession.sessionToken;
  });

  after(async () => {
    // Restore targetUser role and status
    if (targetUser) {
      await prisma.user.update({
        where: { id: targetUser.id },
        data: { role: "USER", status: "ACTIVE" },
      });
    }

    // Clean up test sessions
    if (adminSessionToken) {
      await prisma.userSession.deleteMany({ where: { sessionToken: adminSessionToken } });
    }
    if (userSessionToken) {
      await prisma.userSession.deleteMany({ where: { sessionToken: userSessionToken } });
    }
  });

  // -------------------------------------------------------------
  // Test 1: User list contract verification (data array + meta pagination)
  // -------------------------------------------------------------
  test("1. GET /api/admin/users returns user array in data and pagination in meta", async () => {
    const res = await makeRequest({
      path: "/api/admin/users?page=1&limit=5",
      method: "GET",
      headers: { Cookie: `flowctrl_session=${adminSessionToken}` },
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.data.success, true);
    assert.ok(Array.isArray(res.data.data), "data must be an array of user objects");
    assert.ok(res.data.meta, "meta must contain pagination metadata");
    assert.equal(typeof res.data.meta.total, "number");
    assert.equal(typeof res.data.meta.totalPages, "number");
    assert.equal(res.data.meta.page, 1);
    assert.equal(res.data.meta.limit, 5);

    // Verify user object fields
    const firstUser = res.data.data[0];
    assert.ok(firstUser.id);
    assert.ok(firstUser.email);
    assert.ok(["USER", "ADMIN"].includes(firstUser.role));
    assert.ok(["ACTIVE", "SUSPENDED", "DEACTIVATED"].includes(firstUser.status));
  });

  // -------------------------------------------------------------
  // Test 2: Audit log contract verification (data array + meta pagination)
  // -------------------------------------------------------------
  test("2. GET /api/admin/audit-logs returns log array in data and pagination in meta", async () => {
    const res = await makeRequest({
      path: "/api/admin/audit-logs?page=1&limit=5",
      method: "GET",
      headers: { Cookie: `flowctrl_session=${adminSessionToken}` },
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.data.success, true);
    assert.ok(Array.isArray(res.data.data), "data must be an array of audit logs");
    assert.ok(res.data.meta, "meta must contain pagination metadata");
    assert.equal(typeof res.data.meta.total, "number");
    assert.equal(typeof res.data.meta.totalPages, "number");
  });

  // -------------------------------------------------------------
  // Test 3: Role Management — Promote USER to ADMIN, then Demote to USER
  // -------------------------------------------------------------
  test("3. Promote USER to ADMIN, verify DB persistence, then demote back to USER", async () => {
    // 3a. Promote alex@flowctrl.dev to ADMIN
    const promoteRes = await makeRequest({
      path: `/api/admin/users/${targetUser.id}/role`,
      method: "PATCH",
      headers: {
        Cookie: `flowctrl_session=${adminSessionToken}; flowctrl_csrf=${testCsrfToken}`,
        "x-flowctrl-csrf": testCsrfToken,
      },
      body: { role: "ADMIN" },
    });

    assert.equal(promoteRes.statusCode, 200);
    assert.equal(promoteRes.data.success, true);
    assert.equal(promoteRes.data.data.role, "ADMIN");

    // Verify DB persistence directly
    const dbPromoted = await prisma.user.findUnique({
      where: { id: targetUser.id },
      select: { role: true },
    });
    assert.equal(dbPromoted.role, "ADMIN");

    // 3b. Verify audit log was recorded
    const auditRes1 = await makeRequest({
      path: "/api/admin/audit-logs?page=1&limit=5&action=ADMIN_ROLE_UPDATED",
      method: "GET",
      headers: { Cookie: `flowctrl_session=${adminSessionToken}` },
    });
    assert.equal(auditRes1.statusCode, 200);
    assert.ok(auditRes1.data.data.length > 0);
    const latestAudit = auditRes1.data.data[0];
    assert.equal(latestAudit.action, "ADMIN_ROLE_UPDATED");
    assert.equal(latestAudit.targetId, targetUser.id);
    assert.equal(latestAudit.details.newRole, "ADMIN");

    // 3c. Demote back to USER
    const demoteRes = await makeRequest({
      path: `/api/admin/users/${targetUser.id}/role`,
      method: "PATCH",
      headers: {
        Cookie: `flowctrl_session=${adminSessionToken}; flowctrl_csrf=${testCsrfToken}`,
        "x-flowctrl-csrf": testCsrfToken,
      },
      body: { role: "USER" },
    });

    assert.equal(demoteRes.statusCode, 200);
    assert.equal(demoteRes.data.data.role, "USER");

    // Verify DB persistence
    const dbDemoted = await prisma.user.findUnique({
      where: { id: targetUser.id },
      select: { role: true },
    });
    assert.equal(dbDemoted.role, "USER");
  });

  // -------------------------------------------------------------
  // Test 4: Account Status Management — Suspend and Reactivate
  // -------------------------------------------------------------
  test("4. Suspend user account, verify DB persistence, then reactivate account", async () => {
    // 4a. Suspend account
    const suspendRes = await makeRequest({
      path: `/api/admin/users/${targetUser.id}/status`,
      method: "PATCH",
      headers: {
        Cookie: `flowctrl_session=${adminSessionToken}; flowctrl_csrf=${testCsrfToken}`,
        "x-flowctrl-csrf": testCsrfToken,
      },
      body: { status: "SUSPENDED", reason: "Automated test suspension" },
    });

    assert.equal(suspendRes.statusCode, 200);
    assert.equal(suspendRes.data.data.status, "SUSPENDED");

    // Verify DB
    const dbSuspended = await prisma.user.findUnique({
      where: { id: targetUser.id },
      select: { status: true },
    });
    assert.equal(dbSuspended.status, "SUSPENDED");

    // 4b. Reactivate account
    const activateRes = await makeRequest({
      path: `/api/admin/users/${targetUser.id}/status`,
      method: "PATCH",
      headers: {
        Cookie: `flowctrl_session=${adminSessionToken}; flowctrl_csrf=${testCsrfToken}`,
        "x-flowctrl-csrf": testCsrfToken,
      },
      body: { status: "ACTIVE", reason: "Automated test reactivation" },
    });

    assert.equal(activateRes.statusCode, 200);
    assert.equal(activateRes.data.data.status, "ACTIVE");

    // Verify DB
    const dbActive = await prisma.user.findUnique({
      where: { id: targetUser.id },
      select: { status: true },
    });
    assert.equal(dbActive.status, "ACTIVE");
  });

  // -------------------------------------------------------------
  // Test 5: Self-Modification Lockout Defense
  // -------------------------------------------------------------
  test("5. Admin cannot modify their own role or suspend their own account", async () => {
    // Self role change attempt
    const selfRoleRes = await makeRequest({
      path: `/api/admin/users/${adminUser.id}/role`,
      method: "PATCH",
      headers: {
        Cookie: `flowctrl_session=${adminSessionToken}; flowctrl_csrf=${testCsrfToken}`,
        "x-flowctrl-csrf": testCsrfToken,
      },
      body: { role: "USER" },
    });
    assert.equal(selfRoleRes.statusCode, 400);
    assert.equal(selfRoleRes.data.code, "CANNOT_MODIFY_SELF");

    // Self suspension attempt
    const selfStatusRes = await makeRequest({
      path: `/api/admin/users/${adminUser.id}/status`,
      method: "PATCH",
      headers: {
        Cookie: `flowctrl_session=${adminSessionToken}; flowctrl_csrf=${testCsrfToken}`,
        "x-flowctrl-csrf": testCsrfToken,
      },
      body: { status: "SUSPENDED" },
    });
    assert.equal(selfStatusRes.statusCode, 400);
    assert.equal(selfStatusRes.data.code, "CANNOT_SUSPEND_SELF");
  });

  // -------------------------------------------------------------
  // Test 6: Unauthorized Role / Status Mutations by USER
  // -------------------------------------------------------------
  test("6. Standard USER is rejected with 403 Forbidden on role and status mutations", async () => {
    // Generate fresh session for reactivated active USER
    const freshUserSession = await createSessionRecord(targetUser.id);

    try {
      const userRoleRes = await makeRequest({
        path: `/api/admin/users/${targetUser.id}/role`,
        method: "PATCH",
        headers: {
          Cookie: `flowctrl_session=${freshUserSession.sessionToken}; flowctrl_csrf=${testCsrfToken}`,
          "x-flowctrl-csrf": testCsrfToken,
        },
        body: { role: "ADMIN" },
      });
      assert.equal(userRoleRes.statusCode, 403);
      assert.equal(userRoleRes.data.code, "FORBIDDEN");

      const userStatusRes = await makeRequest({
        path: `/api/admin/users/${targetUser.id}/status`,
        method: "PATCH",
        headers: {
          Cookie: `flowctrl_session=${freshUserSession.sessionToken}; flowctrl_csrf=${testCsrfToken}`,
          "x-flowctrl-csrf": testCsrfToken,
        },
        body: { status: "SUSPENDED" },
      });
      assert.equal(userStatusRes.statusCode, 403);
      assert.equal(userStatusRes.data.code, "FORBIDDEN");
    } finally {
      await prisma.userSession.deleteMany({ where: { sessionToken: freshUserSession.sessionToken } });
    }
  });

  // -------------------------------------------------------------
  // Test 7: Infrastructure & RAG Health Real Probes
  // -------------------------------------------------------------
  test("7. Health probes return real, un-mocked diagnostic data", async () => {
    // 7a. Core Health (/api/health)
    const healthRes = await makeRequest({ path: "/api/health" });
    assert.equal(healthRes.statusCode, 200);
    assert.ok(["healthy", "degraded"].includes(healthRes.data.status));
    assert.equal(typeof healthRes.data.uptime, "number");
    assert.ok(["connected", "degraded_fallback"].includes(healthRes.data.redis));

    // 7b. Readiness Probe (/api/ready)
    const readyRes = await makeRequest({ path: "/api/ready" });
    assert.equal(readyRes.statusCode, 200);
    assert.equal(readyRes.data.status, "ready");
    assert.equal(readyRes.data.database, "connected");
    assert.ok(readyRes.data.memoryUsage);

    // 7c. RAG Diagnostics (/api/rag/health)
    const ragRes = await makeRequest({ path: "/api/rag/health" });
    assert.equal(ragRes.statusCode, 200);
    assert.equal(ragRes.data.success, true);
    assert.equal(ragRes.data.data.expressBackend, "online");
    assert.equal(ragRes.data.data.vectorDatabase, "qdrant");
    assert.ok(ragRes.data.data.pythonRAG);
    assert.equal(typeof ragRes.data.data.pythonRAG.indexedDocuments, "number");
  });
});
