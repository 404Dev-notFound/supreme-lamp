import { useState, useEffect } from "react";

/**
 * Hook to fetch matched jobs from the `/api/job-matcher` endpoint.
 * It forwards any filter or sort parameters to the API.
 */
export default function useJobMatches(filters = {}, sort = "") {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    async function fetchData() {
      try {
        setLoading(true);
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
      } catch (err) {
        if (!ignore && err?.name !== "AbortError") {
          setError(err?.message || "Failed to fetch job matches");
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [JSON.stringify(filters), sort]);

  return { data, loading, error };
}
