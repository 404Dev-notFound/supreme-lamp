import { proxyToBackend } from "@/lib/backendProxy";

export async function GET(req) {
  const { search } = new URL(req.url);
  return proxyToBackend(req, `/api/projects${search}`);
}

export async function POST(req) {
  return proxyToBackend(req, "/api/projects");
}
