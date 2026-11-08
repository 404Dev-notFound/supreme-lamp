const { describe, it } = require("node:test");
const assert = require("node:assert");
const { dsaService } = require("./services/dsa.service");

describe("DSA Engine Backend Service Suite", () => {
  it("1. getLanguages returns all supported languages with valid metadata", () => {
    const langs = dsaService.getLanguages();
    assert.ok(Array.isArray(langs), "Languages should be an array");
    assert.ok(langs.length >= 20, `Expected at least 20 languages, found ${langs.length}`);
    const python = langs.find((l) => l.id === "python");
    assert.ok(python, "Python should be present in languages");
    assert.strictEqual(python.name, "Python");
    assert.ok(python.algorithmCount > 0, "Python should have algorithms");
  });

  it("2. listAlgorithms returns all master algorithms with deep architectural metadata", () => {
    const algos = dsaService.listAlgorithms();
    assert.ok(Array.isArray(algos), "Algorithms should be an array");
    assert.ok(algos.length >= 8, `Expected at least 8 algorithms, found ${algos.length}`);
    
    const binarySearch = algos.find((a) => a.slug === "binary-search");
    assert.ok(binarySearch, "Binary Search should be in algorithms list");
    assert.strictEqual(binarySearch.title, "Binary Search");
    assert.ok(binarySearch.timeComplexity, "Should have timeComplexity");
    assert.ok(binarySearch.spaceComplexity, "Should have spaceComplexity");
    assert.ok(binarySearch.intuition, "Should have intuition");
    assert.ok(binarySearch.problemStatement, "Should have problemStatement");
    assert.ok(binarySearch.codeSnippets, "Should have codeSnippets");
    assert.ok(Object.keys(binarySearch.codeSnippets).length >= 10, "Should have multi-language code snippets");
  });

  it("3. listAlgorithms filters correctly by language", () => {
    const pyAlgos = dsaService.listAlgorithms({ language: "python" });
    assert.ok(pyAlgos.length > 0, "Should find algorithms for python");
    pyAlgos.forEach((a) => {
      assert.ok(a.codeSnippets && a.codeSnippets.python, `Algorithm ${a.slug} should have python snippet`);
    });
  });

  it("4. listAlgorithms filters correctly by search query", () => {
    const sortAlgos = dsaService.listAlgorithms({ search: "sort" });
    assert.ok(sortAlgos.length >= 3, `Expected at least 3 sort algorithms, found ${sortAlgos.length}`);
    sortAlgos.forEach((a) => {
      const match =
        a.title.toLowerCase().includes("sort") ||
        (a.category && a.category.toLowerCase().includes("sort")) ||
        (a.problemStatement && a.problemStatement.toLowerCase().includes("sort"));
      assert.ok(match, `Algorithm ${a.title} should match search query 'sort'`);
    });
  });

  it("5. getAlgorithmBySlug returns the exact requested algorithm or null", () => {
    const algo = dsaService.getAlgorithmBySlug("kadanes-algorithm");
    assert.ok(algo, "Kadane's algorithm should be found");
    assert.strictEqual(algo.slug, "kadanes-algorithm");
    assert.strictEqual(algo.difficulty, "Medium");

    const nonExistent = dsaService.getAlgorithmBySlug("non-existent-algo");
    assert.strictEqual(nonExistent, null, "Non-existent algorithm should return null");
  });

  it("6. getCategories returns unique categories list", () => {
    const cats = dsaService.getCategories();
    assert.ok(Array.isArray(cats), "Categories should be an array");
    assert.ok(cats.includes("Searching Algorithms"), "Should include Searching Algorithms");
    assert.ok(cats.includes("Sorting Algorithms"), "Should include Sorting Algorithms");
  });
});

