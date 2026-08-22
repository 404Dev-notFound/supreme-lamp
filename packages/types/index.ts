export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
}

export interface Company {
  id: string;
  name: string;
  logo: string;
}

export interface MatchedJob {
  id: string;
  title: string;
  location: string;
  workMode: string;
  company: Company;
  matchedSkills: string[];
  missingSkills: string[];
  matchPercent: number;
}

export interface RoadmapResource {
  id: string;
  type: "article" | "video" | "course" | "doc";
  title: string;
  url: string;
}

export interface RoadmapTopic {
  id: string;
  slug: string;
  title: string;
  description: string;
  category?: string;
  resources: RoadmapResource[];
  children?: string[];
  prerequisites?: string[];
}

export interface RoadmapNode {
  id: string;
  label: string;
  topicId: string;
  group?: string;
  level?: number;
  position?: { x: number; y: number };
}

export interface RoadmapEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
  label?: string;
}

export interface RoadmapTrackSummary {
  slug: string;
  title: string;
  description: string;
  category: "role" | "skill" | "best-practice";
  topicCount: number;
  level: "Beginner" | "Intermediate" | "Advanced";
  iconName?: string;
}

export interface RoadmapDetail extends RoadmapTrackSummary {
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
  topics: Record<string, RoadmapTopic>;
}
