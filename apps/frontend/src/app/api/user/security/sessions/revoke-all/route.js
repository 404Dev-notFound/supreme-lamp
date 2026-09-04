import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/user/security/sessions/revoke-all
 * Revokes all active sessions for the current authenticated user.
 * Scoped strictly to authenticated user; never impacts other accounts.
 */
export async function POST() {
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

    await prisma.$transaction([
      prisma.userSession.deleteMany({
        where: { userId: user.id },
      }),
      prisma.securityLog.create({
        data: {
          userId: user.id,
          eventType: "logout_all",
          details: { reason: "User requested sign out everywhere" },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "All active sessions have been revoked.",
    });
  } catch (error) {
    console.error("Revoke all sessions error:", error);
    return NextResponse.json(
      { error: "Failed to revoke all sessions." },
      { status: 500 },
    );
  }
}
