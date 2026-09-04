import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE_NAME,
  validateSessionToken,
  sanitizeAuthUser,
} from "@/lib/sessionCookie";

export async function GET(req) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    // 1. Primary path: check flowctrl_session HTTP-only cookie
    if (sessionCookie?.value) {
      const validation = await validateSessionToken(sessionCookie.value);
      if (validation.valid && validation.user) {
        const res = NextResponse.json(
          {
            authenticated: true,
            user: sanitizeAuthUser(validation.user),
            session: {
              id: validation.session.id,
              deviceType: validation.session.deviceType,
              browser: validation.session.browser,
              os: validation.session.os,
              lastActiveAt: validation.session.lastActiveAt,
            },
          },
          { status: 200 },
        );
        res.headers.set("Cache-Control", "no-store, max-age=0");
        return res;
      }
    }

    // 2. NextAuth compatibility fallback
    const nextAuthToken = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (nextAuthToken?.id || nextAuthToken?.sub) {
      const userId = nextAuthToken.id || nextAuthToken.sub;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      });

      if (user && user.status === "ACTIVE") {
        const res = NextResponse.json(
          {
            authenticated: true,
            user: sanitizeAuthUser(user),
          },
          { status: 200 },
        );
        res.headers.set("Cache-Control", "no-store, max-age=0");
        return res;
      }
    }

    // Unauthenticated
    const res = NextResponse.json(
      {
        authenticated: false,
        user: null,
      },
      { status: 200 },
    );
    res.headers.set("Cache-Control", "no-store, max-age=0");
    return res;
  } catch (err) {
    console.error("[Auth Me API Error]:", err);
    return NextResponse.json(
      {
        authenticated: false,
        error: "Failed to verify authentication status.",
      },
      { status: 500 },
    );
  }
}
