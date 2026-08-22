import type {
  RoadmapDetail,
  RoadmapTopic,
  RoadmapTrackSummary,
} from "@flowctrl/types";

export declare function getAllRoadmaps(): RoadmapTrackSummary[];
export declare function getRoadmapBySlug(slug: string): RoadmapDetail | null;
export declare function getTopicDetail(
  slug: string,
  topicId: string,
): RoadmapTopic | null;
export declare function searchRoadmaps(query: string): RoadmapTrackSummary[];

export type {
  RoadmapDetail,
  RoadmapEdge,
  RoadmapNode,
  RoadmapResource,
  RoadmapTopic,
  RoadmapTrackSummary,
} from "@flowctrl/types";
