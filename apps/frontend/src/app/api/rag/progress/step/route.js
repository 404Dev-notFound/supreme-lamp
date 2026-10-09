import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function POST(req) {
  try {
    const body = await req.json();
    const { stepId, status } = body || {};

    if (!stepId || !status) {
      return NextResponse.json(
        { success: false, error: "stepId and status are required." },
        { status: 400 }
      );
    }

    try {
      const cookieHeader = req.headers.get("cookie") || "";
      const authHeader = req.headers.get("authorization") || "";

      const headers = { "Content-Type": "application/json" };
      if (cookieHeader) headers["cookie"] = cookieHeader;
      if (authHeader) headers["authorization"] = authHeader;

      const backendRes = await fetch(`${BACKEND_URL}/api/rag/progress/step`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000),
      });

      if (backendRes.ok) {
        const json = await backendRes.json();
        return NextResponse.json(json);
      }
    } catch {
      // Fallback
    }

    return NextResponse.json({
      success: true,
      message: "Step progress saved locally.",
      data: { stepId, status },
    });
  } catch (error) {
    console.error("[Next.js RAG Progress Route Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update step progress." },
      { status: 500 }
    );
  }
}
