import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  sanitizeSelfProfile,
  validateProfileUpdate,
} from "@/lib/profileValidation";

/**
 * GET /api/user/profile
 * Returns authenticated user's profile, skills, preferences, and roadmaps.
 * Enforces server-side identity (never trusts client-supplied user IDs).
 */
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
        profile: true,
        preferences: true,
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

    const safeProfile = sanitizeSelfProfile(user);
    const response = NextResponse.json(safeProfile);
    response.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate",
    );
    return response;
  } catch (error) {
    console.error("Fetch profile error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve profile data." },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/user/profile
 * Updates authenticated user's profile and skills with strict mass-assignment protection.
 * Executes atomically in a database transaction.
 */
export async function PUT(req) {
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

    const rawBody = await req.json().catch(() => ({}));

    // Mass-assignment & field validation
    let validated;
    try {
      validated = validateProfileUpdate(rawBody);
    } catch (valErr) {
      return NextResponse.json({ error: valErr.message }, { status: 400 });
    }

    const {
      displayName,
      name,
      headline,
      bio,
      location,
      avatarUrl,
      websiteUrl,
      githubUrl,
      linkedinUrl,
      twitterUrl,
      skills,
    } = validated;

    // Execute atomic update across User, UserProfile, and UserSkills in transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update core User record
      await tx.user.update({
        where: { id: user.id },
        data: {
          name: displayName || name || undefined,
          image: avatarUrl !== undefined ? avatarUrl : undefined,
          headline: headline !== undefined ? headline : undefined,
          bio: bio !== undefined ? bio : undefined,
          location: location !== undefined ? location : undefined,
        },
      });

      // 2. Upsert UserProfile record
      await tx.userProfile.upsert({
        where: { userId: user.id },
        update: {
          displayName: displayName || name || undefined,
          headline: headline !== undefined ? headline : undefined,
          bio: bio !== undefined ? bio : undefined,
          location: location !== undefined ? location : undefined,
          avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
          websiteUrl: websiteUrl !== undefined ? websiteUrl : undefined,
          githubUrl: githubUrl !== undefined ? githubUrl : undefined,
          linkedinUrl: linkedinUrl !== undefined ? linkedinUrl : undefined,
          twitterUrl: twitterUrl !== undefined ? twitterUrl : undefined,
        },
        create: {
          userId: user.id,
          displayName: displayName || name || user.name || "FlowCTRL User",
          headline: headline || "",
          bio: bio || "",
          location: location || "",
          avatarUrl: avatarUrl || "",
          websiteUrl: websiteUrl || "",
          githubUrl: githubUrl || "",
          linkedinUrl: linkedinUrl || "",
          twitterUrl: twitterUrl || "",
        },
      });

      // 3. Synchronize user skills if provided
      if (Array.isArray(skills)) {
        await tx.userSkill.deleteMany({
          where: { userId: user.id },
        });

        for (const s of skills) {
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

    // 4. Fetch fresh updated profile
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        profile: true,
        preferences: true,
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

    const safeProfile = sanitizeSelfProfile(updatedUser);
    const response = NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      profile: safeProfile,
    });
    response.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate",
    );
    return response;
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
