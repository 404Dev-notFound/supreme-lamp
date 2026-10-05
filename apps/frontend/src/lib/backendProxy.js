import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.INTERNAL_BACKEND_URL ||
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

const DISALLOWED_HEADERS = new Set([
  "host",
  "connection",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
  "proxy-connection",
  "proxy-authenticate",
  "te",
]);

/**
 * Hardened proxy utility forwarding requests from Next.js server to Express Backend API.
 * Includes SSRF path validation, hop-by-hop header removal, timeout safeguards, and cookie propagation.
 */
export async function proxyToBackend(req, backendPath) {
  try {
    // 1. Path Traversal & SSRF Defense
    if (
      !backendPath ||
      typeof backendPath !== "string" ||
      !backendPath.startsWith("/api/") ||
      backendPath.includes("..") ||
      backendPath.includes("//") ||
      /[<>'"\s]/.test(backendPath)
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_PROXY_PATH",
          error: "Disallowed or invalid proxy destination.",
        },
        { status: 400 },
      );
    }

    const url = `${BACKEND_URL}${backendPath}`;
    const headers = new Headers();

    // 2. Strip dangerous hop-by-hop headers
    req.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (!DISALLOWED_HEADERS.has(lower)) {
        headers.set(key, value);
      }
    });

    const method = req.method;
    let body = undefined;
    if (!["GET", "HEAD"].includes(method)) {
      try {
        body = await req.text();
      } catch {
        body = undefined;
      }
    }

    // 3. Timeout safeguard with AbortController (10 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let backendRes;
    try {
      backendRes = await fetch(url, {
        method,
        headers,
        body,
        redirect: "manual",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const responseText = await backendRes.text();

    const nextRes = new NextResponse(responseText, {
      status: backendRes.status,
      headers: {
        "Content-Type":
          backendRes.headers.get("content-type") || "application/json",
        "Cache-Control": "no-store, max-age=0",
      },
    });

    // 4. Forward Set-Cookie headers cleanly
    const setCookies =
      backendRes.headers.getSetCookie?.() ||
      [backendRes.headers.get("set-cookie")].filter(Boolean);

    for (const cookieStr of setCookies) {
      nextRes.headers.append("Set-Cookie", cookieStr);
    }

    return nextRes;
  } catch (error) {
    if (error.name === "AbortError") {
      return NextResponse.json(
        {
          success: false,
          code: "GATEWAY_TIMEOUT",
          error: "Backend request timed out.",
        },
        { status: 504 },
      );
    }

    console.error(`[Backend Proxy Error - ${backendPath}]:`, error);
    return NextResponse.json(
      {
        success: false,
        code: "GATEWAY_ERROR",
        error: "Unable to reach authentication service. Please ensure the backend is running.",
      },
      { status: 502 },
    );
  }
}
