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

    const email = session.user.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email },
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
      name: user.name || "",
      email: user.email,
      role: user.role,
      image: user.image,
      headline: user.headline || "",
      bio: user.bio || "",
      location: user.location || "",
      createdAt: user.createdAt,
      skills: (user.userSkills || []).map((us) => ({
        id: us.skillId,
        userSkillId: us.id,
        name: us.skill.name,
        category: us.skill.category,
        proficiency: us.proficiency,
      })),
      roadmaps: (user.roadmaps || []).map((r) => ({
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

    const email = session.user.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User profile not found." },
        { status: 404 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const { name, headline, bio, location, skills } = body;

    // Process and deduplicate skills to prevent unique constraint conflicts
    interface CleanSkill {
      name: string;
      category: string;
      proficiency: number;
    }

    const cleanSkills: CleanSkill[] = [];
    if (Array.isArray(skills)) {
      const seen = new Set<string>();
      for (const item of skills) {
        if (!item || typeof item.name !== "string") continue;
        const skillName = item.name.trim();
        if (!skillName) continue;
        const lower = skillName.toLowerCase();
        if (seen.has(lower)) continue;
        seen.add(lower);

        const skillCategory =
          typeof item.category === "string" && item.category.trim()
            ? item.category.trim()
            : "General";

        const rawProf =
          typeof item.proficiency === "number"
            ? item.proficiency
            : parseInt(String(item.proficiency), 10);

        const proficiency = isNaN(rawProf)
          ? 3
          : Math.min(5, Math.max(1, rawProf));

        cleanSkills.push({
          name: skillName,
          category: skillCategory,
          proficiency,
        });
      }
    }

    // Execute atomic profile update in transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update basic user details
      await tx.user.update({
        where: { id: user.id },
        data: {
          name: typeof name === "string" ? name.trim() : undefined,
          headline: typeof headline === "string" ? headline.trim() : undefined,
          bio: typeof bio === "string" ? bio.trim() : undefined,
          location: typeof location === "string" ? location.trim() : undefined,
        },
      });

      // 2. Synchronize user skills
      if (Array.isArray(skills)) {
        // Clear old user skills
        await tx.userSkill.deleteMany({
          where: { userId: user.id },
        });

        // Insert new user skills with catalog lookup
        for (const s of cleanSkills) {
          const catalogSkill = await tx.skill.upsert({
            where: { name: s.name },
            update: { category: s.category },
            create: {
              name: s.name,
              category: s.category,
            },
          });

          await tx.userSkill.create({
            data: {
              userId: user.id,
              skillId: catalogSkill.id,
              proficiency: s.proficiency,
            },
          });
        }
      }
    });

    // 3. Return fresh profile with populated skills
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
        name: freshProfile?.name || "",
        email: freshProfile?.email,
        role: freshProfile?.role,
        headline: freshProfile?.headline || "",
        bio: freshProfile?.bio || "",
        location: freshProfile?.location || "",
        skills: (freshProfile?.userSkills || []).map((us) => ({
          id: us.skillId,
          userSkillId: us.id,
          name: us.skill.name,
          category: us.skill.category,
          proficiency: us.proficiency,
        })),
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      {
        error:
          "Failed to update profile data: " +
          (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 },
    );
  }
}
