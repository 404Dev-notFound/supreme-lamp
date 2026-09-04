import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_THEMES = ["dark", "light", "system"];
const ALLOWED_VISIBILITY = ["PUBLIC", "PRIVATE", "RECRUITERS_ONLY"];

/**
 * GET /api/user/preferences
 * Returns authenticated user's preferences.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 },
      );
    }

    const email = session.user.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email },
      include: { preferences: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const prefs = user.preferences || {
      theme: "dark",
      emailNotifications: true,
      weeklyDigest: true,
      jobAlerts: true,
      profileVisibility: "PUBLIC",
      careerGoalVisibility: true,
    };

    return NextResponse.json({
      theme: prefs.theme,
      emailNotifications: prefs.emailNotifications,
      weeklyDigest: prefs.weeklyDigest,
      jobAlerts: prefs.jobAlerts,
      profileVisibility: prefs.profileVisibility,
      careerGoalVisibility: prefs.careerGoalVisibility,
    });
  } catch (error) {
    console.error("Fetch preferences error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve preferences." },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/user/preferences
 * Updates user preferences with strict allowlisting.
 */
export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 },
      );
    }

    const email = session.user.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const updateData = {};

    if (body.theme !== undefined) {
      const themeStr = String(body.theme).toLowerCase().trim();
      if (ALLOWED_THEMES.includes(themeStr)) {
        updateData.theme = themeStr;
      }
    }

    if (body.emailNotifications !== undefined) {
      updateData.emailNotifications = Boolean(body.emailNotifications);
    }

    if (body.weeklyDigest !== undefined) {
      updateData.weeklyDigest = Boolean(body.weeklyDigest);
    }

    if (body.jobAlerts !== undefined) {
      updateData.jobAlerts = Boolean(body.jobAlerts);
    }

    if (body.profileVisibility !== undefined) {
      const visStr = String(body.profileVisibility).toUpperCase().trim();
      if (ALLOWED_VISIBILITY.includes(visStr)) {
        updateData.profileVisibility = visStr;
      }
    }

    if (body.careerGoalVisibility !== undefined) {
      updateData.careerGoalVisibility = Boolean(body.careerGoalVisibility);
    }

    const updated = await prisma.userPreference.upsert({
      where: { userId: user.id },
      update: updateData,
      create: {
        userId: user.id,
        theme: updateData.theme || "dark",
        emailNotifications: updateData.emailNotifications ?? true,
        weeklyDigest: updateData.weeklyDigest ?? true,
        jobAlerts: updateData.jobAlerts ?? true,
        profileVisibility: updateData.profileVisibility || "PUBLIC",
        careerGoalVisibility: updateData.careerGoalVisibility ?? true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Preferences updated successfully.",
      preferences: {
        theme: updated.theme,
        emailNotifications: updated.emailNotifications,
        weeklyDigest: updated.weeklyDigest,
        jobAlerts: updated.jobAlerts,
        profileVisibility: updated.profileVisibility,
        careerGoalVisibility: updated.careerGoalVisibility,
      },
    });
  } catch (error) {
    console.error("Update preferences error:", error);
    return NextResponse.json(
      { error: "Failed to update preferences." },
      { status: 500 },
    );
  }
}
