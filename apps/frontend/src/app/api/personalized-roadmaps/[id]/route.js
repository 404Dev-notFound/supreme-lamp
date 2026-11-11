import { proxyToBackend } from "@/lib/backendProxy";

export async function GET(req, { params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  return proxyToBackend(req, `/api/personalized-roadmaps/${id}`);
}

export async function DELETE(req, { params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  return proxyToBackend(req, `/api/personalized-roadmaps/${id}`);
}

