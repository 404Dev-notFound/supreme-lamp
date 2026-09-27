import { NextResponse } from "next/server";
import { getAllRoadmaps, searchRoadmaps } from "@flowctrl/roadmap-data";

/**
 * GET /api/roadmaps
 * Query Parameters:
 *   - search: string
 *   - category: string
 *   - level: string
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const level = searchParams.get("level");

    let results = search ? searchRoadmaps(search) : getAllRoadmaps();

    if (category && category.trim()) {
      results = results.filter(
        (r) => r.category.toLowerCase() === category.toLowerCase().trim(),
      );
    }

    if (level && level.trim()) {
      results = results.filter(
        (r) => r.level.toLowerCase() === level.toLowerCase().trim(),
      );
    }

    const response = NextResponse.json({
      success: true,
      count: results.length,
      data: results,
    });

    response.headers.set("Cache-Control", "public, max-age=300, s-maxage=600");
    return response;
  } catch (error) {
    console.error("[Roadmaps API Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve roadmaps." },
      { status: 500 },
    );
  }
}
