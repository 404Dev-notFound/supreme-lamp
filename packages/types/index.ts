export type UserRole =
  | "GUEST"
  | "USER"
  | "MENTOR"
  | "RECRUITER"
  | "COMPANY_REP"
  | "ADMIN"
  | "SUPER_ADMIN";

export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: UserRole | string;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface UserSkill {
  id: string;
  userId: string;
  skillId: string;
  proficiency: number; // 1 to 5
  skill?: Skill;
}

export interface UserProfileResponse {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: UserRole | string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  createdAt: string | Date;
  skills: Array<{
    id: string;
    name: string;
    category: string;
    proficiency: number;
  }>;
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
