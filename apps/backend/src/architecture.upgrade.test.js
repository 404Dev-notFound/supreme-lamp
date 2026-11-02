const test = require("node:test");
const assert = require("node:assert/strict");

const { requestTimingMiddleware } = require("./middleware/requestTiming.middleware");
const {
  validateProjectId,
  validateIssueId,
  validateCreateProject,
  validateUpdateProject,
  validateCreateIssue,
  validateUpdateIssue,
} = require("./validators/projects.validator");
const {
  validateSlug,
  validateTopicId,
  sanitizeSearchQuery,
  sanitizeFilterValue,
} = require("./validators/roadmaps.validator");
const {
  validateUserId,
  validateSessionId,
  validateAvatarId,
} = require("./validators/users.validator");
const projectsService = require("./services/projects.service");
const roadmapsService = require("./services/roadmaps.service");

// =========================================================================
// 1. Request Timing Middleware Test
// =========================================================================
test("Request Timing Middleware - Measures duration and attaches X-Response-Time", (t, done) => {
  const req = {};
  const headers = {};
  const res = {
    headersSent: false,
    setHeader: (name, val) => {
      headers[name] = val;
    },
    writeHead: function (...args) {
      return this;
    },
  };

  requestTimingMiddleware(req, res, () => {
    // Simulate brief processing
    setTimeout(() => {
      res.writeHead(200);
      assert.ok(headers["X-Response-Time"], "Header must be present");
      assert.match(headers["X-Response-Time"], /^\d+(\.\d+)?ms$/);
      done();
    }, 10);
  });
});

// =========================================================================
// 2. Projects Validator & IDOR Protection Tests
// =========================================================================
test("Projects Validator - Validates identifiers, creations, and updates", () => {
  // Safe identifiers
  assert.equal(validateProjectId("prj_12345").isValid, true);
  assert.equal(validateProjectId("invalid id with spaces").isValid, false);
  assert.equal(validateProjectId("").isValid, false);
  assert.equal(validateProjectId(null).isValid, false);

  assert.equal(validateIssueId("iss_999").isValid, true);
  assert.equal(validateIssueId("!bad!id").isValid, false);

  // Create project
  const validProj = validateCreateProject({
    title: "Realtime Collaboration Engine",
    category: "Full Stack",
    difficulty: "Advanced",
    techStack: ["Node.js", "PostgreSQL", "Prisma"],
    githubUrl: "https://github.com/flowctrl/engine",
  });
  assert.equal(validProj.isValid, true);
  assert.equal(validProj.sanitized.title, "Realtime Collaboration Engine");
  assert.equal(validProj.sanitized.githubUrl, "https://github.com/flowctrl/engine");

  const invalidProj = validateCreateProject({ title: "" });
  assert.equal(invalidProj.isValid, false);
  assert.ok(invalidProj.errors.includes("Project title is required."));

  // Update project
  const updateProj = validateUpdateProject({
    title: "Updated Title",
    difficulty: "Expert",
  });
  assert.equal(updateProj.isValid, true);
  assert.equal(updateProj.sanitized.title, "Updated Title");
  assert.equal(updateProj.sanitized.difficulty, "Expert");

  // Create issue
  const validIssue = validateCreateIssue({
    title: "Fix database connection retry",
    priority: "HIGH",
    status: "TODO",
    tags: ["bug", "database"],
  });
  assert.equal(validIssue.isValid, true);
  assert.equal(validIssue.sanitized.title, "Fix database connection retry");
  assert.equal(validIssue.sanitized.priority, "HIGH");

  const invalidIssue = validateCreateIssue({ title: "  " });
  assert.equal(invalidIssue.isValid, false);
});

// =========================================================================
// 3. Projects Service Permission Enforcement
// =========================================================================
test("Projects Service - canModifyProject enforces ownership and RBAC", () => {
  const project = {
    id: "proj-1",
    ownerId: "user-alice",
    members: [
      { userId: "user-alice", projectRole: "owner" },
      { userId: "user-bob", projectRole: "admin" },
      { userId: "user-charlie", projectRole: "member" },
    ],
  };

  assert.equal(
    projectsService.canModifyProject({ id: "user-alice", role: "USER" }, project),
    true,
    "Alice (owner) can modify",
  );
  assert.equal(
    projectsService.canModifyProject({ id: "user-bob", role: "USER" }, project),
    true,
    "Bob (admin member) can modify",
  );
  assert.equal(
    projectsService.canModifyProject({ id: "user-charlie", role: "USER" }, project),
    false,
    "Charlie (regular member) cannot modify",
  );
  assert.equal(
    projectsService.canModifyProject({ id: "user-admin", role: "ADMIN" }, project),
    true,
    "Platform Admin can modify",
  );
  assert.equal(
    projectsService.canModifyProject({ id: "user-stranger", role: "USER" }, project),
    false,
    "Stranger cannot modify",
  );
});

// =========================================================================
// 4. Roadmaps Validator & Service Tests
// =========================================================================
test("Roadmaps Validator - Validates slugs, topics, and sanitizes queries", () => {
  // Slugs
  assert.equal(validateSlug("frontend").isValid, true);
  assert.equal(validateSlug("ai-engineer").isValid, true);
  assert.equal(validateSlug("../path/traversal").isValid, false);
  assert.equal(validateSlug("slug with spaces").isValid, false);

  // Topic IDs
  assert.equal(validateTopicId("html-basics").isValid, true);
  assert.equal(validateTopicId("topic/../injection").isValid, false);

  // Search queries & filters
  assert.equal(sanitizeSearchQuery("   React Framework   "), "React Framework");
  assert.equal(sanitizeFilterValue("  FRONTEND  "), "frontend");
});

test("Roadmaps Service - Lists and filters roadmaps properly", async () => {
  const roadmaps = await roadmapsService.getAllRoadmaps({ search: "backend" });
  assert.ok(Array.isArray(roadmaps));
  assert.ok(roadmaps.length > 0);
  assert.ok(
    roadmaps.some((r) => r.slug.includes("backend") || r.title.toLowerCase().includes("backend")),
  );

  const detail = await roadmapsService.getRoadmapBySlug("frontend");
  assert.ok(detail);
  assert.equal(detail.slug, "frontend");
});

// =========================================================================
// 5. Users Validator Tests
// =========================================================================
test("Users Validator - Validates user identifiers and avatar names", () => {
  assert.equal(validateUserId("usr_abc123").isValid, true);
  assert.equal(validateUserId("").isValid, false);
  assert.equal(validateUserId("user<script>").isValid, false);

  assert.equal(validateSessionId("sess_98765").isValid, true);
  assert.equal(validateSessionId("   ").isValid, false);

  assert.equal(validateAvatarId("avatar_123.png").isValid, true);
  assert.equal(validateAvatarId("../etc/passwd").isValid, false);
});

