import { proxyToBackend } from "@/lib/backendProxy";

export async function GET(req) {
  return proxyToBackend(req, "/api/auth/me");
}
