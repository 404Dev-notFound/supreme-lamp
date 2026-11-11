import { proxyToBackend } from "@/lib/backendProxy";

export async function POST(req, { params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  return proxyToBackend(req, `/api/personalized-roadmaps/${id}/progress`);
}

