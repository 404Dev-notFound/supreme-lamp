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
