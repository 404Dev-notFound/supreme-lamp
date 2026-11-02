const test = require("node:test");
const assert = require("node:assert/strict");
const {
  getAllRoadmaps,
  getRoadmapBySlug,
  getTopicDetail,
  searchRoadmaps,
} = require("@flowctrl/roadmap-data");
const roadmapsService = require("../services/roadmaps.service");

test("Roadmaps data layer loads index properly", () => {
  const roadmaps = getAllRoadmaps();
  assert.ok(Array.isArray(roadmaps));
  assert.ok(roadmaps.length > 0);

  const frontend = roadmaps.find((r) => r.slug === "frontend");
  assert.ok(frontend, "Frontend roadmap summary should exist");
  assert.equal(frontend.slug, "frontend");
  assert.ok((frontend.topicCount || 0) > 0);
});

test("Roadmap detail retrieves complete graph and topic map", () => {
  const roadmap = getRoadmapBySlug("frontend");
  assert.ok(roadmap, "Frontend roadmap should be found");
  assert.equal(roadmap.slug, "frontend");
  assert.ok(Array.isArray(roadmap.nodes));
  assert.ok(roadmap.nodes.length > 0);
  assert.ok(roadmap.topics);

  const topicIds = Object.keys(roadmap.topics);
  assert.ok(topicIds.length > 0);

  const firstTopic = roadmap.topics[topicIds[0]];
  assert.ok(firstTopic.title);
  assert.ok(firstTopic.description);
});

test("Non-existent roadmap returns null", () => {
  const roadmap = getRoadmapBySlug("unknown-non-existent-slug");
  assert.equal(roadmap, null);
});

test("Search filtering finds relevant roadmaps", () => {
  const results = searchRoadmaps("React");
  assert.ok(results.length > 0);
  assert.ok(
    results.some(
      (r) =>
        r.title.toLowerCase().includes("react") ||
        r.slug.toLowerCase().includes("react"),
    ),
  );
});

test("Roadmaps Service pins Premium Roadmaps at the top of the catalog", async () => {
  const all = await roadmapsService.getAllRoadmaps();
  assert.ok(all.length >= 6, "Expected at least 6 roadmaps in total");

  // First 6 entries must be pinned premium tracks
  const topSix = all.slice(0, 6);
  for (const track of topSix) {
    assert.equal(track.isPremium, true, `Track ${track.slug} should be premium`);
    assert.equal(track.isPinned, true, `Track ${track.slug} should be pinned`);
    assert.equal(track.badge, "PREMIUM");
  }

  // Follow-up entries should be non-pinned free roadmaps
  const remainder = all.slice(6);
  assert.ok(remainder.length > 0);
  assert.equal(remainder[0].isPinned, false);
  assert.equal(remainder[0].isPremium, false);
});

test("Roadmaps Service category filtering supports 'premium'", async () => {
  const premiumTracks = await roadmapsService.getAllRoadmaps({ category: "premium" });
  assert.ok(premiumTracks.length >= 6);
  for (const t of premiumTracks) {
    assert.equal(t.isPremium, true);
    assert.equal(t.isPinned, true);
  }
});

test("Roadmaps Service getRoadmapBySlug returns isPinned flag", async () => {
  const premiumRoadmap = await roadmapsService.getRoadmapBySlug("distributed-systems-architecture");
  assert.ok(premiumRoadmap);
  assert.equal(premiumRoadmap.isPinned, true);
  assert.equal(premiumRoadmap.isPremium, true);

  const freeRoadmap = await roadmapsService.getRoadmapBySlug("frontend");
  assert.ok(freeRoadmap);
  assert.equal(freeRoadmap.isPinned, false);
  assert.equal(freeRoadmap.isPremium, false);
});

