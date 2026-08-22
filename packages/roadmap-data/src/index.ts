import type {
  RoadmapDetail,
  RoadmapTopic,
  RoadmapTrackSummary,
} from "@flowctrl/types";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const indexData = require("./data/index.json");

export function getAllRoadmaps(): RoadmapTrackSummary[] {
  return indexData || [];
}

export function getRoadmapBySlug(slug: string): RoadmapDetail | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require(`./data/${slug}.json`) as RoadmapDetail;
  } catch {
    return null;
  }
}

export function getTopicDetail(
  slug: string,
  topicId: string
): RoadmapTopic | null {
  const roadmap = getRoadmapBySlug(slug);
  if (!roadmap || !roadmap.topics) return null;
  return roadmap.topics[topicId] || null;
}

export function searchRoadmaps(query: string): RoadmapTrackSummary[] {
  const all = getAllRoadmaps();
  if (!query || !query.trim()) return all;
  const q = query.toLowerCase().trim();
  return all.filter(
    (r) =>
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.slug.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q)
  );
}

export type {
  RoadmapDetail,
  RoadmapEdge,
  RoadmapNode,
  RoadmapResource,
  RoadmapTopic,
  RoadmapTrackSummary,
} from "@flowctrl/types";
