const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { app } = require("./app");
const { prisma } = require("./lib/prisma");

describe("Project-Building Tutorials API & Integration Suite", () => {
  let testUser;
  let testUserToken;
  let sampleProject;

  before(async () => {
    // 1. Fetch or create a test user
    testUser = await prisma.user.upsert({
      where: { email: "project_tester@flowctrl.io" },
      update: { status: "ACTIVE" },
      create: {
        email: "project_tester@flowctrl.io",
        name: "Project Tester",
        role: "USER",
        status: "ACTIVE",
      },
    });

    // 2. Fetch a seeded project tutorial
    sampleProject = await prisma.projectTutorial.findFirst({
      where: { isPublished: true },
      include: { steps: true, resources: true },
    });

    assert.ok(sampleProject, "At least one project tutorial should exist in the database");
  });

  after(async () => {
    // Clean up test progress created during testing
    if (testUser && sampleProject) {
      await prisma.userProjectProgress.deleteMany({
        where: { userId: testUser.id },
      });
      await prisma.projectBookmark.deleteMany({
        where: { userId: testUser.id },
      });
    }
  });

  test("1. GET /api/project-tutorials/categories returns all categories with counts", async () => {
    const res = await fetch("http://localhost:5000/api/project-tutorials/categories");
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 8);

    const dbCategory = body.data.find((c) => c.slug === "databases");
    assert.ok(dbCategory);
    assert.equal(typeof dbCategory.projectCount, "number");
  });

  test("2. GET /api/project-tutorials/languages returns distinct languages", async () => {
    const res = await fetch("http://localhost:5000/api/project-tutorials/languages");
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.includes("C") || body.data.includes("Go") || body.data.includes("Python"));
  });

  test("3. GET /api/project-tutorials lists paginated projects", async () => {
    const res = await fetch("http://localhost:5000/api/project-tutorials?page=1&limit=5");
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length <= 5);
    assert.ok(body.pagination);
    assert.equal(body.pagination.page, 1);
    assert.equal(body.pagination.limit, 5);

    const first = body.data[0];
    assert.ok(first.title);
    assert.ok(first.slug);
    assert.ok(first.difficulty);
    assert.ok(first.totalSteps >= 1);
  });

  test("4. GET /api/project-tutorials with category filter returns matching projects", async () => {
    const res = await fetch("http://localhost:5000/api/project-tutorials?category=databases");
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.every((p) => p.categorySlug === "databases"));
  });

  test("5. GET /api/project-tutorials with search query finds keyword matches", async () => {
    const res = await fetch("http://localhost:5000/api/project-tutorials?search=SQLite");
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.length >= 1);
    assert.ok(body.data[0].title.includes("SQLite") || body.data[0].description.includes("SQLite"));
  });

  test("6. GET /api/project-tutorials/:slug retrieves detailed project, steps, and resources", async () => {
    const res = await fetch(`http://localhost:5000/api/project-tutorials/${sampleProject.slug}`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.id, sampleProject.id);
    assert.ok(Array.isArray(body.data.steps));
    assert.ok(body.data.steps.length >= 1);
    assert.ok(Array.isArray(body.data.resources));
    assert.ok(body.data.whatYouWillBuild);
    assert.ok(body.data.learningOutcomes.length >= 1);
  });

  test("7. GET /api/project-tutorials/non-existent-slug returns 404", async () => {
    const res = await fetch("http://localhost:5000/api/project-tutorials/non-existent-slug-xyz");
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.code, "NOT_FOUND");
  });

  test("8. POST /api/project-tutorials/:id/start requires authentication", async () => {
    const res = await fetch(`http://localhost:5000/api/project-tutorials/${sampleProject.id}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    assert.equal(res.status, 401);
  });

  test("9. User progress lifecycle: Start project, complete steps, and track progress", async () => {
    const { projectTutorialsService } = require("./services/projectTutorials.service");

    // 1. Start Project
    const started = await projectTutorialsService.startProject(testUser.id, sampleProject.id);
    assert.equal(started.status, "IN_PROGRESS");
    assert.equal(started.progressPercent, 0);

    // 2. Complete Step 1
    const step1Updated = await projectTutorialsService.updateStepProgress(
      testUser.id,
      sampleProject.id,
      1,
      true,
      "Finished setting up the REPL buffer!"
    );
    assert.equal(step1Updated.completedStepCount, 1);
    assert.ok(step1Updated.progressPercent > 0);

    // 3. Verify step progress is reflected in getProjectBySlug
    const detailed = await projectTutorialsService.getProjectBySlug(sampleProject.slug, testUser.id);
    assert.ok(detailed.userProgress);
    assert.equal(detailed.userProgress.completedStepCount, 1);
    assert.ok(detailed.userProgress.completedStepIds.length >= 1);

    // 4. Complete all steps
    const completed = await projectTutorialsService.completeProject(testUser.id, sampleProject.id);
    assert.equal(completed.status, "COMPLETED");
    assert.equal(completed.progressPercent, 100);

    // 5. Verify user progress list
    const myProgress = await projectTutorialsService.getUserProgressList(testUser.id);
    assert.ok(myProgress.some((p) => p.projectTutorialId === sampleProject.id && p.status === "COMPLETED"));
  });

  test("10. Project bookmarking: Toggle and retrieve bookmarks", async () => {
    const { projectTutorialsService } = require("./services/projectTutorials.service");

    // Toggle on
    const res1 = await projectTutorialsService.toggleBookmark(testUser.id, sampleProject.id);
    assert.equal(res1.bookmarked, true);

    const bookmarks = await projectTutorialsService.getUserBookmarks(testUser.id);
    assert.ok(bookmarks.some((b) => b.project.id === sampleProject.id));

    // Toggle off
    const res2 = await projectTutorialsService.toggleBookmark(testUser.id, sampleProject.id);
    assert.equal(res2.bookmarked, false);
  });
});
