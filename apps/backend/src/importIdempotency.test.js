const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { prisma } = require("./lib/prisma");

describe("Import Pipeline Idempotency & Attribution Test", () => {
  test("Database contains expected imported records with proper source attribution", async () => {
    // 1. Verify total count
    const totalCount = await prisma.projectTutorial.count();
    assert.ok(totalCount >= 1000, `Expected at least 1000 projects, got ${totalCount}`);

    // 2. Verify source attribution on imported records
    const sampleImported = await prisma.projectTutorial.findFirst({
      where: {
        sourceRepositories: { isEmpty: false },
      },
    });

    assert.ok(sampleImported, "Should find imported projects with sourceRepositories");
    assert.ok(sampleImported.sourceRepositories.length >= 1, "Source repositories should not be empty");
    assert.ok(
      sampleImported.sourceRepositories.some((url) => url.includes("github.com")),
      "Source repositories should contain GitHub URLs"
    );

    // 3. Verify slugs are unique (no duplicates)
    const duplicates = await prisma.$queryRaw`
      SELECT slug, COUNT(*) 
      FROM "ProjectTutorial" 
      GROUP BY slug 
      HAVING COUNT(*) > 1;
    `;
    assert.equal(duplicates.length, 0, "No duplicate slugs should exist");

    // 4. Verify categories are populated
    const categoryCount = await prisma.projectTutorialCategory.count();
    assert.ok(categoryCount > 0, "Categories should be created");
  });
});

