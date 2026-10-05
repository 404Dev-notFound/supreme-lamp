import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.INTERNAL_BACKEND_URL ||
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

/**
 * Clean proxy utility forwarding requests from Next.js server to Express Backend API.
 * Forwards request body, incoming headers, cookies, and responses (including Set-Cookie).
 */
export async function proxyToBackend(req, backendPath) {
  try {
    const url = `${BACKEND_URL}${backendPath}`;
    const headers = new Headers();

    req.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (lower !== "host" && lower !== "connection") {
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

    const backendRes = await fetch(url, {
      method,
      headers,
      body,
      redirect: "manual",
    });

    const responseText = await backendRes.text();

    const nextRes = new NextResponse(responseText, {
      status: backendRes.status,
      headers: {
        "Content-Type":
          backendRes.headers.get("content-type") || "application/json",
        "Cache-Control": "no-store, max-age=0",
      },
    });

    // Forward Set-Cookie headers cleanly
    const setCookies =
      backendRes.headers.getSetCookie?.() ||
      [backendRes.headers.get("set-cookie")].filter(Boolean);

    for (const cookieStr of setCookies) {
      nextRes.headers.append("Set-Cookie", cookieStr);
    }

    return nextRes;
  } catch (error) {
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
