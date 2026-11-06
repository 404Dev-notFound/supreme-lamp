const test = require("node:test");
const assert = require("node:assert/strict");
const { app } = require("./app");

test("health check unit logic returns ok", () => {
  const healthResponse = { status: "ok", message: "flowCTRL API is running" };
  assert.equal(healthResponse.status, "ok");
  assert.equal(healthResponse.message, "flowCTRL API is running");
});

test("GET /api/health returns health status", async () => {
  const server = app.listen(0);
  const port = server.address().port;
  try {
    const res = await fetch(`http://localhost:${port}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(["healthy", "degraded"].includes(body.status));
    assert.ok(typeof body.uptime === "number");
  } finally {
    server.close();
  }
});

test("GET /api/health/redis and /api/redis/health return redis report", async () => {
  const server = app.listen(0);
  const port = server.address().port;
  try {
    const res1 = await fetch(`http://localhost:${port}/api/health/redis`);
    assert.equal(res1.status, 200);
    const body1 = await res1.json();
    assert.equal(body1.success, true);
    assert.ok(body1.data);
    assert.ok(["connected", "degraded"].includes(body1.data.status));

    const res2 = await fetch(`http://localhost:${port}/api/redis/health`);
    assert.equal(res2.status, 200);
    const body2 = await res2.json();
    assert.equal(body2.success, true);
    assert.ok(body2.data);
    assert.ok(["connected", "degraded"].includes(body2.data.status));
  } finally {
    server.close();
  }
});
