import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  validateSessionToken,
  revokeAllUserSessions,
  getCookieOptions,
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

    // Revoke all sessions in DB
    await revokeAllUserSessions(userId);

    // Record security log
    prisma.securityLog
      .create({
        data: {
          userId,
          eventType: "logout_all_devices",
          ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
          userAgent: req.headers.get("user-agent") || "Web Client",
        },
      })
      .catch(() => {});

    // Clear cookies
    const { sessionCookie: sessOpts, csrfCookie: csrfOpts } = getCookieOptions();

    cookieStore.set(SESSION_COOKIE_NAME, "", {
      ...sessOpts,
      maxAge: 0,
      expires: new Date(0),
    });

    cookieStore.set(CSRF_COOKIE_NAME, "", {
      ...csrfOpts,
      maxAge: 0,
      expires: new Date(0),
    });

    cookieStore.set("next-auth.session-token", "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });

    const res = NextResponse.json(
      {
        success: true,
        message: "Successfully signed out from all devices.",
      },
      { status: 200 },
    );
    res.headers.set("Cache-Control", "no-store, max-age=0");
    return res;
  } catch (err) {
    console.error("[Logout All API Error]:", err);
    return NextResponse.json(
      { success: false, error: "Failed to process logout from all devices." },
      { status: 500 },
    );
  }
}
