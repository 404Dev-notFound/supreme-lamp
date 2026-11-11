import { proxyToBackend } from "@/lib/backendProxy";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.toString();
  const path = query ? `/api/personalized-roadmaps?${query}` : `/api/personalized-roadmaps`;
  return proxyToBackend(req, path);
}

export async function POST(req) {
  return proxyToBackend(req, "/api/personalized-roadmaps");
}

