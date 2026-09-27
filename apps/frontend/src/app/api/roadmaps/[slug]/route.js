import { NextResponse } from "next/server";
import { getRoadmapBySlug } from "@flowctrl/roadmap-data";

/**
 * GET /api/roadmaps/[slug]
 */
export async function GET(req, { params }) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Roadmap slug is required." },
        { status: 400 },
      );
    }

    const roadmap = getRoadmapBySlug(String(slug));

    if (!roadmap) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `Roadmap track '${slug}' was not found.`,
          },
        },
        { status: 404 },
      );
    }

    const response = NextResponse.json({
      success: true,
      data: roadmap,
    });

    response.headers.set("Cache-Control", "public, max-age=300, s-maxage=600");
    return response;
  } catch (error) {
    console.error("[Roadmap Detail API Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve roadmap details." },
      { status: 500 },
    );
  }
}
