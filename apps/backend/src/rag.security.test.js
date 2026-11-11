const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const ragController = require("./controllers/rag.controller");
const { requireAuth, requireRole } = require("./middleware/auth.middleware");

function createMockReqRes({ user = null, body = {}, params = {}, query = {}, headers = {} } = {}) {
  let statusCode = 200;
  let responseData = null;
  let ended = false;

  const req = {
    user,
    body,
    params,
    query,
    headers,
  };

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    setHeader() {
      return this;
    },
    getHeader() {
      return null;
    },
    json(data) {
      responseData = data;
      ended = true;
      return this;
    },
    send(data) {
      responseData = data;
      ended = true;
      return this;
    },
  };

  return {
    req,
    res,
    getStatus: () => statusCode,
    getData: () => responseData,
  };
}

describe("RAG Admin Authorization & Security Suite", () => {
  const normalUser = {
    id: "user_normal_001",
    email: "user@flowctrl.dev",
    role: "USER",
    name: "Standard Student",
  };

  const adminUser = {
    id: "user_admin_999",
    email: "admin@flowctrl.dev",
    role: "ADMIN",
    name: "Security Admin",
  };

  test("1. Unauthenticated request to /admin/reindex is rejected with 401", async () => {
    const { req, res, getStatus, getData } = createMockReqRes({ user: null });
    let nextCalled = false;
    await requireAuth(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, false);
    assert.equal(getStatus(), 401);
    assert.equal(getData().code, "UNAUTHORIZED");
  });

  test("2. Non-admin user is rejected with 403 Forbidden", async () => {
    const { req, res, getStatus, getData } = createMockReqRes({ user: normalUser });
    let nextCalled = false;
    const rbac = requireRole(["ADMIN"]);
    rbac(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, false);
    assert.equal(getStatus(), 403);
    assert.equal(getData().code, "FORBIDDEN");
  });

  test("3. Admin user with invalid X-Admin-Key is rejected with 401 Unauthorized", async () => {
    const { req, res, getStatus, getData } = createMockReqRes({
      user: adminUser,
      headers: { "x-admin-key": "invalid-malicious-key-attempt" },
    });

    await ragController.adminReindex(req, res, () => {});
    assert.equal(getStatus(), 401);
    assert.ok(getData().message.includes("Provided administrative key is invalid"));
  });

  test("4. GET /api/rag/health returns unified system status with fallback indicator", async () => {
    const { req, res, getStatus, getData } = createMockReqRes();
    await ragController.getRagHealth(req, res, () => {});

    assert.equal(getStatus(), 200);
    const health = getData().data;
    assert.ok(health);
    assert.equal(health.expressBackend, "online");
    assert.equal(health.vectorDatabase, "qdrant");
    assert.equal(health.fallbackAvailable, true);
  });
});

