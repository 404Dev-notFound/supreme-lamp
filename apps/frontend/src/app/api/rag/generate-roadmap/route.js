import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const PYTHON_RAG_URL = process.env.RAG_SERVICE_URL || "http://127.0.0.1:8001";

export async function POST(req) {
  try {
    const body = await req.json();
    const { query, experienceLevel, goals } = body || {};

    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid career goal, skill, or learning objective." },
        { status: 400 }
      );
    }

    // Try Express backend first with cookies
    try {
      const cookieHeader = req.headers.get("cookie") || "";
      const authHeader = req.headers.get("authorization") || "";

      const headers = { "Content-Type": "application/json" };
      if (cookieHeader) headers["cookie"] = cookieHeader;
      if (authHeader) headers["authorization"] = authHeader;

      const backendRes = await fetch(`${BACKEND_URL}/api/rag/generate-roadmap`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000),
      });

      if (backendRes.ok) {
        const json = await backendRes.json();
        return NextResponse.json(json);
      }
    } catch {
      // Fall through to direct Python RAG microservice
    }

    // Fallback directly to Python LangChain RAG microservice
    try {
      const pyRes = await fetch(`${PYTHON_RAG_URL}/api/rag/generate-roadmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          experience_level: experienceLevel || "Beginner",
          goals: Array.isArray(goals) ? goals : [],
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (pyRes.ok) {
        const pyData = await pyRes.json();
        return NextResponse.json({
          success: true,
          data: pyData,
          message: "Roadmap generated successfully.",
        });
      }
    } catch (err) {
      console.error("[Next.js RAG Route] Python service unreachable:", err);
    }

    return NextResponse.json(
      { success: false, error: "Failed to generate roadmap. RAG service is temporarily unavailable." },
      { status: 502 }
    );
  } catch (error) {
    console.error("[Next.js RAG Route Error]:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred during roadmap generation." },
      { status: 500 }
    );
  }
}
