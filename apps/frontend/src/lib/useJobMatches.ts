import { useState, useEffect } from 'react';

interface Company {
  id: string;
  name: string;
  logo: string;
}

interface Job {
  id: string;
  companyId: string;
  title: string;
  description: string;
  location: string;
  salary: number;
  postedAt: string;
}

interface Profile {
  id: string;
  skills: string[];
  targetRole: string;
  preferredIndustry: string;
  experienceYears: number;
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

/**
 * Hook to fetch matched jobs from the `/api/job-matcher` endpoint.
 * It forwards any filter or sort parameters to the API.
 */
export default function useJobMatches(filters: Record<string, string>, sort: string) {
  const [data, setData] = useState<MatchedJob[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const query = new URLSearchParams({ ...filters, sort }).toString();
    fetch(`/api/job-matcher?${query}`)
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [filters, sort]);

  return { data, loading, error };
}
