import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sanitizePublicProfile } from "@/lib/profileValidation";

/**
 * GET /api/users/[id]
 * Public profile endpoint with strict PII protection.
 * Returns only public details; never leaks email, phone, or credentials.
 */
export async function GET(req, { params }) {
  try {
    const { id } = await params;

    if (!id || typeof id !== "string" || !id.trim()) {
      return NextResponse.json(
        { error: "A valid user ID is required." },
        { status: 400 },
      );
    }

    const cleanId = id.trim();

    const user = await prisma.user.findUnique({
      where: { id: cleanId },
      include: {
        profile: true,
        preferences: true,
        userSkills: {
          include: { skill: true },
          orderBy: { proficiency: "desc" },
        },
        roadmaps: {
          where: { isPublic: true },
          take: 10,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 },
      );
    }

    const publicProfile = sanitizePublicProfile(user);

    const response = NextResponse.json(publicProfile);
    response.headers.set("Cache-Control", "public, max-age=60, s-maxage=120");
    return response;
  } catch (error) {
    console.error("Public profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve user profile." },
      { status: 500 },
    );
  }
}
