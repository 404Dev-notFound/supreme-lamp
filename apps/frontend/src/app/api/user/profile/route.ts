import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to view your profile." },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase() },
      include: {
        userSkills: {
          include: { skill: true },
          orderBy: { proficiency: "desc" },
        },
        roadmaps: {
          take: 5,
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User profile not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
      headline: user.headline || "",
      bio: user.bio || "",
      location: user.location || "",
      createdAt: user.createdAt,
      skills: user.userSkills.map((us) => ({
        id: us.skillId,
        userSkillId: us.id,
        name: us.skill.name,
        category: us.skill.category,
        proficiency: us.proficiency,
      })),
      roadmaps: user.roadmaps.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        updatedAt: r.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Fetch profile error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve profile data." },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to update your profile." },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User profile not found." },
        { status: 404 },
      );
    }

    const body = await req.json();
    const { name, headline, bio, location, skills } = body;

    // Update User Profile data (strictly enforcing user ownership)
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: typeof name === "string" ? name.trim() : undefined,
        headline: typeof headline === "string" ? headline.trim() : undefined,
        bio: typeof bio === "string" ? bio.trim() : undefined,
        location: typeof location === "string" ? location.trim() : undefined,
      },
    });

    // If skills are updated, sync user-owned skills
    if (Array.isArray(skills)) {
      // Remove existing UserSkill associations for this user
      await prisma.userSkill.deleteMany({
        where: { userId: user.id },
      });

      // Insert new/updated skills
      for (const item of skills) {
        if (!item.name || typeof item.name !== "string") continue;
        const skillName = item.name.trim();
        const skillCategory = (item.category || "General").trim();
        const proficiency = Math.min(
          5,
          Math.max(1, parseInt(item.proficiency, 10) || 3),
        );

        // Upsert global catalog skill
        const catalogSkill = await prisma.skill.upsert({
          where: { name: skillName },
          update: {},
          create: {
            name: skillName,
            category: skillCategory,
          },
        });

        // Create user-specific skill ownership record
        await prisma.userSkill.create({
          data: {
            userId: user.id,
            skillId: catalogSkill.id,
            proficiency,
          },
        });
      }
    }

    // Retrieve fresh profile with relations
    const freshProfile = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        userSkills: {
          include: { skill: true },
          orderBy: { proficiency: "desc" },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      profile: {
        id: freshProfile?.id,
        name: freshProfile?.name,
        email: freshProfile?.email,
        role: freshProfile?.role,
        headline: freshProfile?.headline,
        bio: freshProfile?.bio,
        location: freshProfile?.location,
        skills: freshProfile?.userSkills.map((us) => ({
          id: us.skillId,
          name: us.skill.name,
          category: us.skill.category,
          proficiency: us.proficiency,
        })),
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile data." },
      { status: 500 },
    );
  }
}
