import test from "node:test";
import assert from "node:assert/strict";
import {
  getAllRoadmaps,
  getRoadmapBySlug,
  getTopicDetail,
  searchRoadmaps,
} from "@flowctrl/roadmap-data";

test("Roadmaps data layer loads index properly", () => {
  const roadmaps = getAllRoadmaps();
  assert.ok(Array.isArray(roadmaps));
  assert.ok(roadmaps.length > 0);

  const frontend = roadmaps.find((r) => r.slug === "frontend");
  assert.ok(frontend, "Frontend roadmap summary should exist");
  assert.equal(frontend?.slug, "frontend");
  assert.ok((frontend?.topicCount || 0) > 0);
});

test("Roadmap detail retrieves complete graph and topic map", () => {
  const roadmap = getRoadmapBySlug("frontend");
  assert.ok(roadmap, "Frontend roadmap should be found");
  assert.equal(roadmap?.slug, "frontend");
  assert.ok(Array.isArray(roadmap?.nodes));
  assert.ok(roadmap!.nodes.length > 0);
  assert.ok(roadmap?.topics);

  const topicIds = Object.keys(roadmap!.topics);
  assert.ok(topicIds.length > 0);

  const firstTopic = roadmap!.topics[topicIds[0]];
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
