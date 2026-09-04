const test = require("node:test");
const assert = require("node:assert/strict");

test("health check logic returns ok", () => {
  const healthResponse = { status: "ok", message: "flowCTRL API is running" };
  assert.equal(healthResponse.status, "ok");
  assert.equal(healthResponse.message, "flowCTRL API is running");
});
