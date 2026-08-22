import { useState, useEffect } from "react";

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

/**
 * Hook to fetch matched jobs from the `/api/job-matcher` endpoint.
 * It forwards any filter or sort parameters to the API.
 */
export default function useJobMatches(
  filters: Record<string, string>,
  sort: string,
) {
  const [data, setData] = useState<MatchedJob[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    async function fetchData() {
      try {
        const query = new URLSearchParams({ ...filters, sort }).toString();
        const res = await fetch(`/api/job-matcher?${query}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Network response was not ok");
        const json = await res.json();
        if (!ignore) {
          setData(json);
          setLoading(false);
          setError(null);
        }
      } catch (err: unknown) {
        if (!ignore && (err as Error)?.name !== "AbortError") {
          setError(err instanceof Error ? err.message : "Unknown error");
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [filters, sort]);

  return { data, loading, error };
}
