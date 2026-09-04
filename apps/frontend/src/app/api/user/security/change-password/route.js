import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

const DUMMY_BCRYPT_HASH =
  "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

/**
 * POST /api/user/security/change-password
 * Changes authenticated user's password, records security audit log,
 * and invalidates all other active sessions for this account.
 */
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to change your password." },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || typeof currentPassword !== "string") {
      return NextResponse.json(
        { error: "Current password is required." },
        { status: 400 },
      );
    }

    if (
      !newPassword ||
      typeof newPassword !== "string" ||
      newPassword.length < 8
    ) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long." },
        { status: 400 },
      );
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "New passwords do not match." },
        { status: 400 },
      );
    }

    const email = session.user.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      // Timing attack mitigation
      await bcrypt.compare(currentPassword, DUMMY_BCRYPT_HASH);
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 400 },
      );
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 400 },
      );
    }

    // Securely hash new password
    const newHashed = await bcrypt.hash(newPassword, 10);

    // Atomically update password, log security event, and revoke other sessions
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { password: newHashed },
      });

      await tx.securityLog.create({
        data: {
          userId: user.id,
          eventType: "password_change",
          ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
          userAgent: req.headers.get("user-agent") || "Web Client",
        },
      });

      // Invalidate existing sessions in userSession table
      await tx.userSession.deleteMany({
        where: { userId: user.id },
      });
    });

    const response = NextResponse.json({
      success: true,
      message:
        "Password changed successfully. All other active sessions have been revoked.",
    });
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "An error occurred while changing password." },
      { status: 500 },
    );
  }
}
