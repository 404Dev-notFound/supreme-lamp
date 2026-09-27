import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getToken } from "next-auth/jwt";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE_NAME,
  validateSessionToken,
  createSessionRecord,
  revokeAllUserSessions,
} from "@/lib/sessionCookie";

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    let userId = null;

    if (sessionCookie?.value) {
      const validation = await validateSessionToken(sessionCookie.value);
      if (validation.valid && validation.user) {
        userId = validation.user.id;
      }
    }

    if (!userId) {
      const nextAuthToken = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });
      userId = nextAuthToken?.id || nextAuthToken?.sub;
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, code: "AUTH_REQUIRED", error: "Authentication required." },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { currentPassword, newPassword, confirmPassword } = body || {};

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          code: "VALIDATION_ERROR",
          error: "Current password and new password are required.",
        },
        { status: 400 },
      );
    }

    if (String(newPassword).length < 8) {
      return NextResponse.json(
        {
          success: false,
          code: "VALIDATION_ERROR",
          error: "New password must be at least 8 characters long.",
        },
        { status: 400 },
      );
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          code: "VALIDATION_ERROR",
          error: "New passwords do not match.",
        },
        { status: 400 },
      );
    }

    // Retrieve user from DB
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { success: false, code: "INVALID_USER", error: "User not found or password not set." },
        { status: 404 },
      );
    }

    // Verify current password
    const isCurrentValid = await bcrypt.compare(
      String(currentPassword),
      user.password,
    );

    if (!isCurrentValid) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_CREDENTIALS",
          error: "The current password entered is incorrect.",
        },
        { status: 400 },
      );
    }

    // Hash new password
    const newHash = await bcrypt.hash(String(newPassword), 10);

    // Revoke previous sessions
    await revokeAllUserSessions(userId);

    // Update user password and record security log
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { password: newHash },
      }),
      prisma.securityLog.create({
        data: {
          userId,
          eventType: "password_change",
          ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
          userAgent: req.headers.get("user-agent") || "Web Client",
          details: { method: "user_account_settings" },
        },
      }),
    ]);

    // Issue a fresh session cookie for the current client
    const { sessionToken, csrfToken, cookieOptions } =
      await createSessionRecord(userId, req);

    cookieStore.set(
      cookieOptions.sessionCookie.name,
      sessionToken,
      cookieOptions.sessionCookie,
    );
    cookieStore.set(
      cookieOptions.csrfCookie.name,
      csrfToken,
      cookieOptions.csrfCookie,
    );

    const res = NextResponse.json(
      {
        success: true,
        message: "Password changed successfully. Active sessions have been refreshed.",
      },
      { status: 200 },
    );
    res.headers.set("Cache-Control", "no-store, max-age=0");
    return res;
  } catch (err) {
    console.error("[Change Password API Error]:", err);
    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        error: "Failed to update password. Please try again.",
      },
      { status: 500 },
    );
  }
}
