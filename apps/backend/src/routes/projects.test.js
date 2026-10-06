const test = require("node:test");
const assert = require("node:assert");
const { isSafeUrl } = require("../utils/security");

test("Project Security - URL validation ensures safe project githubUrl and image", () => {
  // Disallowed dangerous protocols
  assert.strictEqual(isSafeUrl("javascript:alert(1)"), false);
  assert.strictEqual(isSafeUrl("data:text/html;base64,PHNjcmlwdD4="), false);
  assert.strictEqual(isSafeUrl("file:///etc/passwd"), false);

  // Allowed protocols
  assert.strictEqual(isSafeUrl("https://github.com/flowctrl/flowctrl"), true);
  assert.strictEqual(
    isSafeUrl("https://images.unsplash.com/photo-1555066931-4365d14bab8c"),
    true,
  );
  assert.strictEqual(isSafeUrl("http://localhost:3000/demo.png"), true);
});

test("Project Validation - Title and attributes parsing contract", () => {
  function sanitizeProjectInput(body) {
    const { title, category, difficulty, techStack, githubUrl } = body;
    if (!title || typeof title !== "string" || !title.trim()) {
      return { isValid: false, error: "Project title is required." };
    }

    let parsedTechStack = [];
    if (Array.isArray(techStack)) {
      parsedTechStack = techStack.map((t) => String(t).trim()).filter(Boolean);
    } else if (typeof techStack === "string") {
      parsedTechStack = techStack
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    let safeGithub = null;
    if (githubUrl && typeof githubUrl === "string" && githubUrl.trim()) {
      if (isSafeUrl(githubUrl.trim())) {
        safeGithub = githubUrl.trim();
      }
    }

    return {
      isValid: true,
      data: {
        title: title.trim(),
        category: category ? String(category).trim() : "General",
        difficulty: difficulty ? String(difficulty).trim() : "Intermediate",
        techStack: parsedTechStack,
        githubUrl: safeGithub,
      },
    };
  }

  // Valid project
  const valid = sanitizeProjectInput({
    title: "flowCTRL Core Platform",
    category: "Full-Stack",
    difficulty: "Advanced",
    techStack: ["Node.js", "Express", "PostgreSQL"],
    githubUrl: "https://github.com/flowctrl/platform",
  });
  assert.strictEqual(valid.isValid, true);
  assert.strictEqual(valid.data.title, "flowCTRL Core Platform");
  assert.deepStrictEqual(valid.data.techStack, [
    "Node.js",
    "Express",
    "PostgreSQL",
  ]);

  // Invalid missing title
  const invalidNoTitle = sanitizeProjectInput({
    title: "   ",
    category: "Full-Stack",
  });
  assert.strictEqual(invalidNoTitle.isValid, false);
  assert.strictEqual(invalidNoTitle.error, "Project title is required.");

  // Unsafe URL stripped
  const maliciousUrl = sanitizeProjectInput({
    title: "Malicious Project",
    githubUrl: "javascript:alert('xss')",
  });
  assert.strictEqual(maliciousUrl.isValid, true);
  assert.strictEqual(maliciousUrl.data.githubUrl, null);
});

test("Issue Validation - Status and Priority enum verification", () => {
  const VALID_STATUSES = ["TODO", "IN_PROGRESS", "DONE"];
  const VALID_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

  function sanitizeIssueInput(body) {
    const { title, status, priority, tags } = body;
    if (!title || typeof title !== "string" || !title.trim()) {
      return { isValid: false, error: "Issue title is required." };
    }

    const cleanStatus = VALID_STATUSES.includes(status) ? status : "TODO";
    const cleanPriority = VALID_PRIORITIES.includes(priority)
      ? priority
      : "MEDIUM";

    let tagsArray = [];
    if (Array.isArray(tags)) {
      tagsArray = tags.map((t) => String(t).trim()).filter(Boolean);
    } else if (typeof tags === "string") {
      tagsArray = tags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    return {
      isValid: true,
      data: {
        title: title.trim(),
        status: cleanStatus,
        priority: cleanPriority,
        tags: tagsArray,
      },
    };
  }

  // Valid issue
  const valid = sanitizeIssueInput({
    title: "Implement real-time PostgreSQL persistence",
    status: "IN_PROGRESS",
    priority: "HIGH",
    tags: ["database", "prisma"],
  });
  assert.strictEqual(valid.isValid, true);
  assert.strictEqual(valid.data.status, "IN_PROGRESS");
  assert.strictEqual(valid.data.priority, "HIGH");
  assert.deepStrictEqual(valid.data.tags, ["database", "prisma"]);

  // Invalid missing title
  const missingTitle = sanitizeIssueInput({ title: "" });
  assert.strictEqual(missingTitle.isValid, false);

  // Status and priority defaults applied on invalid input
  const fallback = sanitizeIssueInput({
    title: "Valid title",
    status: "INVALID_STATUS",
    priority: "SUPER_URGENT",
  });
  assert.strictEqual(fallback.isValid, true);
  assert.strictEqual(fallback.data.status, "TODO");
  assert.strictEqual(fallback.data.priority, "MEDIUM");
});

test("Project IDOR Defense - Ownership and permission enforcement", () => {
  function canModifyProject(user, project) {
    if (!user || !project) return false;
    if (["ADMIN", "SUPER_ADMIN"].includes(user.role)) return true;
    if (project.ownerId === user.id) return true;
    if (
      project.members &&
      project.members.some(
        (m) =>
          m.userId === user.id && ["owner", "admin"].includes(m.projectRole),
      )
    ) {
      return true;
    }
    return false;
  }

  const ownerUser = { id: "usr_alice", role: "USER" };
  const memberAdmin = { id: "usr_bob", role: "USER" };
  const regularMember = { id: "usr_charlie", role: "USER" };
  const platformAdmin = { id: "usr_admin", role: "ADMIN" };
  const stranger = { id: "usr_stranger", role: "USER" };

  const project = {
    id: "prj_001",
    ownerId: "usr_alice",
    members: [
      { userId: "usr_alice", projectRole: "owner" },
      { userId: "usr_bob", projectRole: "admin" },
      { userId: "usr_charlie", projectRole: "viewer" },
    ],
  };

  assert.strictEqual(
    canModifyProject(ownerUser, project),
    true,
    "Owner has permission",
  );
  assert.strictEqual(
    canModifyProject(memberAdmin, project),
    true,
    "Member admin has permission",
  );
  assert.strictEqual(
    canModifyProject(regularMember, project),
    false,
    "Viewer member has no permission",
  );
  assert.strictEqual(
    canModifyProject(platformAdmin, project),
    true,
    "Platform admin has permission",
  );
  assert.strictEqual(
    canModifyProject(stranger, project),
    false,
    "Stranger has no permission",
  );
});
