import { proxyToBackend } from "@/lib/backendProxy";

export async function GET(req, { params }) {
  const { slug } = await params;
  const path = Array.isArray(slug) ? slug.join("/") : slug;
  const { search } = new URL(req.url);
  return proxyToBackend(req, `/api/projects/${path}${search}`);
}

export async function POST(req, { params }) {
  const { slug } = await params;
  const path = Array.isArray(slug) ? slug.join("/") : slug;
  return proxyToBackend(req, `/api/projects/${path}`);
}

export async function PUT(req, { params }) {
  const { slug } = await params;
  const path = Array.isArray(slug) ? slug.join("/") : slug;
  return proxyToBackend(req, `/api/projects/${path}`);
}

export async function PATCH(req, { params }) {
  const { slug } = await params;
  const path = Array.isArray(slug) ? slug.join("/") : slug;
  return proxyToBackend(req, `/api/projects/${path}`);
}

export async function DELETE(req, { params }) {
  const { slug } = await params;
  const path = Array.isArray(slug) ? slug.join("/") : slug;
  return proxyToBackend(req, `/api/projects/${path}`);
}
