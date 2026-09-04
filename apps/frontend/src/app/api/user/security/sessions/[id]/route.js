import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/user/security/sessions/[id]
 * Revokes an individual session.
 * STRICT IDOR PROTECTION: Validates that the session belongs exclusively
 * to the authenticated user before executing deletion.
 */
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 },
      );
    }

    const { id } = await params;
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "A valid session ID is required." },
        { status: 400 },
      );
    }

    const email = session.user.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Lookup session with ownership check (IDOR Prevention)
    const targetSession = await prisma.userSession.findUnique({
      where: { id },
    });

    if (!targetSession) {
      return NextResponse.json(
        { error: "Session not found." },
        { status: 404 },
      );
    }

    if (targetSession.userId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden. You do not have permission to revoke this session." },
        { status: 403 },
      );
    }

    // Delete session and log security event
    await prisma.$transaction([
      prisma.userSession.delete({
        where: { id },
      }),
      prisma.securityLog.create({
        data: {
          userId: user.id,
          eventType: "session_revoked",
          details: { sessionId: id },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Session revoked successfully.",
    });
  } catch (error) {
    console.error("Revoke session error:", error);
    return NextResponse.json(
      { error: "Failed to revoke session." },
      { status: 500 },
    );
  }
}
