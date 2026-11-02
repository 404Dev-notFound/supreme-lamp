import { proxyToBackend } from "@/lib/backendProxy";

export async function POST(req) {
  return proxyToBackend(req, "/api/auth/signup");
}
